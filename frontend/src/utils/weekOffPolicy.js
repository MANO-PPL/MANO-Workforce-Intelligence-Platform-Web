/**
 * Week-Off Policy UI Helpers
 * This file mirrors the backend logic for converting between the UI state
 * and the stored JSON structure.
 */

function weekdayOccurrence(date) {
    return Math.ceil(new Date(date).getDate() / 7);
}

function tryParse(raw, fallback = null) {
    if (raw == null) return fallback;
    if (typeof raw !== 'string') return raw;
    try { return JSON.parse(raw); } catch { return fallback; }
}

function normaliseFreq(frequency) {
    if (!frequency || frequency === 'every') return 'every';
    if (Array.isArray(frequency)) return frequency.map(Number);
    if (typeof frequency === 'number') return [frequency];
    return 'every';
}

function normalisePolicyInput(raw) {
    if (!raw) return [];
    const parsed = tryParse(raw, raw);
    if (Array.isArray(parsed)) return parsed;
    if (Array.isArray(parsed?.rules)) return parsed.rules;
    return [];
}

function toSortedArray(weeks) {
    const src = weeks instanceof Set ? [...weeks] : [...(weeks || [])];
    return src.map(Number).sort((a, b) => a - b);
}

function mapToRules(map) {
    return [...map.entries()].map(([day, ruleData]) => ({ day, weeks: [...ruleData.weeks], timing: ruleData.timing }));
}

/**
 * Build a week_off_policy array from three UI configurator inputs.
 * @param {string[]} workingDays  Day names e.g. ['Mon', 'Tue']
 * @param {Array<{day:string,weeks:number[]}>} weekOffRules
 * @param {Array<{day:string,weeks:number[],timing?:Object}>} halfDayRules
 * @returns {Object[]}
 */
export function buildPolicy(workingDays = [], weekOffRules = [], halfDayRules = []) {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const policy = [];

    for (let d = 0; d < 7; d++) {
        const dayName = dayNames[d];
        const isWorking = workingDays.includes(dayName);
        
        const woRule = weekOffRules.find(r => r.day === dayName);
        const hdRule = halfDayRules.find(r => r.day === dayName);
        const hdWeeks = hdRule ? hdRule.weeks : [];

        if (isWorking) {
            // Working days default to 100% working.
            // They can only have Half Day exceptions.
            if (hdRule && hdWeeks.length > 0) {
                const entry = { day: dayName, type: 'half', frequency: hdWeeks.length >= 5 ? 'every' : hdWeeks };
                if (hdRule.timing && hdRule.timing.start_time) entry.timing = hdRule.timing;
                policy.push(entry);
            }
        } else {
            // Non-working days default to OFF every week.
            let offWeeks = [1, 2, 3, 4, 5];
            
            if (woRule && woRule.weeks.length > 0) {
                // Explicitly provided Alternate Full Days Off
                offWeeks = [...woRule.weeks];
            } else if (hdWeeks.length > 0) {
                // No explicit off weeks, but has half days. Remaining weeks are fully off.
                offWeeks = [1, 2, 3, 4, 5].filter(w => !hdWeeks.includes(w));
            }

            if (offWeeks.length > 0) {
                policy.push({ day: dayName, type: 'full', frequency: offWeeks.length >= 5 ? 'every' : offWeeks });
            }
            
            if (hdRule && hdWeeks.length > 0) {
                const entry = { day: dayName, type: 'half', frequency: hdWeeks.length >= 5 ? 'every' : hdWeeks };
                if (hdRule.timing && hdRule.timing.start_time) entry.timing = hdRule.timing;
                policy.push(entry);
            }
        }
    }

    return policy;
}

/**
 * Reconstruct the three configurator inputs from a stored policy.
 * @param {Object[]|string} policy
 * @returns {{ workingDays: string[], weekOffRules: Array, halfDayRules: Array }}
 */
export function parsePolicy(policy) {
    const entries = normalisePolicyInput(policy);
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    const workingDaysIndices = new Set([0, 1, 2, 3, 4, 5, 6]);
    const weekOffMap = new Map();
    const halfDayMap = new Map();

    for (const entry of entries) {
        const freq = normaliseFreq(entry.frequency);
        const type = (entry.type || 'full').toLowerCase();
        const dayIdx = dayNames.indexOf(entry.day);

        // Fallback for old data with integer days
        const resolvedDay = dayIdx !== -1 ? entry.day : (typeof entry.day === 'number' ? dayNames[entry.day] : null);
        if (!resolvedDay) continue;
        const resolvedDayIdx = dayNames.indexOf(resolvedDay);

        // Any rule indicating a day is fully off on any week means it's not a 100% standard working day
        if (type === 'full') {
            workingDaysIndices.delete(resolvedDayIdx);
            if (freq !== 'every') {
                if (!weekOffMap.has(resolvedDay)) weekOffMap.set(resolvedDay, { weeks: new Set(), timing: null });
                freq.forEach(w => weekOffMap.get(resolvedDay).weeks.add(w));
            }
            continue;
        }

        if (type === 'half') {
            if (!halfDayMap.has(resolvedDay)) halfDayMap.set(resolvedDay, { weeks: new Set(), timing: null });
            const ruleData = halfDayMap.get(resolvedDay);
            if (entry.timing) ruleData.timing = entry.timing;

            if (freq === 'every') {
                [1, 2, 3, 4, 5].forEach(w => ruleData.weeks.add(w));
            } else {
                freq.forEach(w => ruleData.weeks.add(w));
            }
        }
    }

    // Cleanup auto-generated full-off weeks for half-day days
    for (const [day, rule] of halfDayMap.entries()) {
        const woRule = weekOffMap.get(day);
        if (woRule) {
            const hdWeeks = Array.from(rule.weeks);
            const woWeeks = Array.from(woRule.weeks);
            const totalWeeks = new Set([...hdWeeks, ...woWeeks]);
            
            // If they perfectly cover 1,2,3,4,5 and have no overlap
            if (totalWeeks.size === 5 && hdWeeks.length + woWeeks.length === 5) {
                // It was an auto-fallback. We can safely remove it from the UI state.
                weekOffMap.delete(day);
            }
        }
    }

    // Convert back to string arrays
    const workingDays = [...workingDaysIndices].sort().map(d => dayNames[d]);
    
    const weekOffRules = mapToRules(weekOffMap);
    const halfDayRules = mapToRules(halfDayMap);

    return { workingDays, weekOffRules, halfDayRules };
}
