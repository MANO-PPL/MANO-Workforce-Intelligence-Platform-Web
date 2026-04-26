import { attendanceDB } from '../../config/database.js';
import { verifyUserGeofence } from "./geofencing.js";

/**
 * Shift Management Service
 * Handles shift timing, late calculation, status evaluation, and session context.
 * This is the primary engine for attendance logic.
 */

/**
 * Helper to parse boolean values from various types
 */
function parseBool(val, defaultVal = false) {
    if (val === null || val === undefined || val === '') return defaultVal;
    if (typeof val === 'boolean') return val;
    if (typeof val === 'number') return val !== 0;
    if (typeof val === 'string') {
        const s = val.toLowerCase().trim();
        return s === 'true' || s === '1' || s === 'yes' || s === 'on' || s === 'active';
    }
    return !!val;
}

/**
 * Get shift rules from shift object
 * Combines direct shift columns with optional policy_rules JSON for backward compatibility.
 */
export function getShiftRules(shift) {
    if (!shift) {
        return getDefaultShiftConfig();
    }

    // Parse policy_rules if it's a string
    let rules = shift.policy_rules;
    if (typeof rules === 'string') {
        try {
            rules = JSON.parse(rules);
        } catch (e) {
            rules = {};
        }
    }

    // Merge direct shift columns into a unified rules object
    // Direct columns take priority if they exist
    const overtimeEnabled = parseBool(
        shift.is_overtime_enabled ?? rules.overtime?.enabled, 
        true
    );

    const overtimeThreshold = Number(shift.overtime_threshold_hours || rules.overtime?.threshold || 8);

    return {
        shift_timing: {
            start_time: shift.start_time || rules.shift_timing?.start_time || "09:00:00",
            end_time: shift.end_time || rules.shift_timing?.end_time || "18:00:00"
        },
        grace_period: {
            minutes: Number(shift.grace_period_mins !== undefined && shift.grace_period_mins !== null ? shift.grace_period_mins : (rules.grace_period?.minutes || 10))
        },
        overtime: {
            enabled: overtimeEnabled,
            threshold: overtimeThreshold
        },
        entry_requirements: rules.entry_requirements || {
            selfie: true,
            geofence: true
        }
    };
}

/**
 * Default shift configuration
 */
function getDefaultShiftConfig() {
    return {
        shift_timing: {
            start_time: "09:00:00",
            end_time: "18:00:00"
        },
        grace_period: {
            minutes: 10
        },
        overtime: {
            enabled: true,
            threshold: 8
        },
        entry_requirements: {
            selfie: true,
            geofence: true
        }
    };
}

/**
 * Check Location Compliance
 * @returns {Promise<{ok: boolean, error?: string}>}
 */
export async function checkLocationCompliance(user_id, lat, lng, accuracy, requirements) {
    // 1. Basic Validation
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
        return { ok: false, error: "Invalid or missing latitude/longitude" };
    }

    const MAX_ALLOWED_ACCURACY = 200;
    if (!accuracy || accuracy > MAX_ALLOWED_ACCURACY) {
        return { ok: false, error: `Location accuracy too poor (${Math.round(accuracy)}m). GPS/Wi-Fi required (< ${MAX_ALLOWED_ACCURACY}m).` };
    }

    const reqs = requirements || {};
    // Handle both old nested and new flat structures
    const geoPolicy = reqs.geolocation || reqs; 
    
    // If not required, pass
    if (geoPolicy.geofence === false || geoPolicy.required === false) return { ok: true };

    // 2. Perform Geofence Check
    const isInLocation = await verifyUserGeofence(user_id, lat, lng);

    if (!isInLocation) {
        return { ok: false, error: "You are outside the allowed work location." };
    }

    return { ok: true };
}

/**
 * Check Biometric/Selfie Compliance
 * @returns {{ok: boolean, error?: string}}
 */
export function checkBiometricCompliance(file, requirements) {
    const reqs = requirements || {};
    const selfiePolicy = reqs.selfie || {};

    // If not required, pass
    if (selfiePolicy === false || selfiePolicy.required === false) return { ok: true };

    // 2. Check if file exists
    if (!file) {
        return { ok: false, error: "Selfie is required for this check-in/out." };
    }

    return { ok: true };
}

/**
 * Calculate late arrival and grace period compliance
 * @param {string} localTime - Local time in ISO format
 * @param {Object} rules - Unified shift rules
 * @returns {Object} Late calculation result
 */
export function calculateLateArrival(localTime, rules) {
    let minutesLate = 0;
    const timing = rules?.shift_timing || {};
    const startTimeStr = timing.start_time;

    if (startTimeStr) {
        const localTimePart = localTime.split('T')[1]?.split('.')[0] || localTime;
        
        const [curH, curM] = localTimePart.split(':').map(Number);
        const currentMinutes = curH * 60 + curM;
        
        const [shiftH, shiftM] = startTimeStr.split(':').map(Number);
        const shiftMinutes = shiftH * 60 + shiftM;
        
        if (currentMinutes > shiftMinutes) {
            minutesLate = currentMinutes - shiftMinutes;
        }
    }
    
    const gracePeriod = Number(rules?.grace_period?.minutes || 0);
    const isLate = minutesLate > gracePeriod;

    return {
        minutesLate,
        isLate,
        gracePeriod,
        shiftStartTime: startTimeStr
    };
}

/**
 * Evaluate status based on shift rules and session context
 */
export function evaluateStatus(rules, data) {
    // 1. Overtime Check (Priority)
    // Use total_hours_today if available, otherwise fallback to session total_hours
    const rawTotal = data.total_hours_today ?? data.total_hours ?? 0;
    const totalHours = Number(rawTotal) || 0;
    
    // Threshold defaults to 8 if missing, NaN, or 0
    let threshold = Number(rules?.overtime?.threshold);
    if (isNaN(threshold) || threshold <= 0) threshold = 8;

    if (totalHours > threshold) {
        return "OVERTIME";
    }




    // 2. Absent Check (Less than 4 hours total at checkout)
    if (totalHours < 4 && data.event_type === "time_out") {
        return "ABSENT";
    }

    // 3. Late Check
    const graceMins = Number(rules.grace_period?.minutes || 0);
    const minutesLate = Number(data.minutes_late || 0);

    if (minutesLate > graceMins) {
        return "LATE";
    }

    return "PRESENT";
}

/**
 * Build session context for a user's day
 * @param {number} user_id 
 * @param {string} localTime - Current local time
 * @param {string} eventType - "time_in" or "time_out"
 * @returns {Promise<Object>} Session context data
 */
export async function buildSessionContext(user_id, localTime, eventType) {
    // Sanitize time for SQL
    const sanitizedLocalTime = localTime.replace('T', ' ').split('.')[0];
    
    const todaySessions = await attendanceDB("attendance_records")
        .where({ user_id })
        .whereRaw("DATE(time_in) = DATE(?)", [sanitizedLocalTime])
        .orderBy("time_in", "asc");

    const isFirstSession = todaySessions.length === 0;
    const sessionNumber = todaySessions.length + 1;

    // Calculate total hours worked today
    let totalHoursToday = 0;
    todaySessions.forEach(session => {
        if (session.time_out) {
            const duration = (new Date(session.time_out) - new Date(session.time_in)) / (1000 * 60 * 60);
            totalHoursToday += duration;
        }
    });

    const firstTimeIn = todaySessions[0]?.time_in;
    const lastTimeOut = todaySessions[todaySessions.length - 1]?.time_out;

    return {
        is_first_session: isFirstSession,
        session_number: sessionNumber,
        total_sessions: todaySessions.length,
        
        // Time data
        first_time_in: firstTimeIn,
        last_time_out: lastTimeOut,
        
        // Aggregates
        total_hours_today: parseFloat(totalHoursToday.toFixed(2)),
        first_session_late_mins: todaySessions[0]?.late_minutes || 0,
        
        // Event context
        event_type: eventType
    };
}

