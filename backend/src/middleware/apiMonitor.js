import EventBus from '../utils/EventBus.js';
import { getEventSource } from '../utils/clientInfo.js';

// Recursive helper to mask sensitive fields in request bodies
function maskSensitiveFields(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    
    const sensitiveKeys = new Set([
        'password', 'user_password', 'admin_password', 'admin_password_confirm',
        'token', 'refreshToken', 'jwt', 'otp', 'pin', 'secret', 'captcha',
        'authorization', 'cookie'
    ]);

    const masked = Array.isArray(obj) ? [] : {};
    
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const val = obj[key];
            if (sensitiveKeys.has(key.toLowerCase())) {
                masked[key] = '********';
            } else if (typeof val === 'object' && val !== null) {
                masked[key] = maskSensitiveFields(val);
            } else {
                masked[key] = val;
            }
        }
    }
    
    return masked;
}

// Helper to classify Express route path to specific application module
function getModuleFromPath(path) {
    const lowerPath = path.toLowerCase();
    
    // Normalize path by stripping the global /api prefix if present
    let apiPath = lowerPath;
    if (apiPath.startsWith('/api')) {
        apiPath = apiPath.slice(4);
    }
    if (!apiPath.startsWith('/')) {
        apiPath = '/' + apiPath;
    }

    if (apiPath.startsWith('/auth')) return 'Authentication';
    
    if (apiPath.startsWith('/attendance')) {
        if (apiPath.includes('monitor') || apiPath.includes('realtime') || apiPath.includes('live')) {
            return 'Live Attendance';
        }
        return 'Attendance';
    }
    
    if (apiPath.startsWith('/leaves')) return 'Leaves';
    if (apiPath.startsWith('/holiday')) return 'Holidays';
    if (apiPath.startsWith('/policies')) return 'Shift Policies';
    if (apiPath.startsWith('/notifications')) return 'Notifications';
    
    if (apiPath.startsWith('/dar')) {
        if (apiPath.includes('report')) return 'DAR Reports & AI';
        return 'DAR (Daily Activity)';
    }
    
    if (apiPath.startsWith('/organizations')) return 'Organizations';
    if (apiPath.startsWith('/employee')) return 'Employees';
    if (apiPath.startsWith('/profile')) return 'Profile';
    if (apiPath.startsWith('/feedback')) return 'Feedback';
    if (apiPath.startsWith('/payment')) return 'Payments';
    if (apiPath.startsWith('/website-chatbot') || apiPath.startsWith('/chatbot')) return 'Chatbot';
    if (apiPath.startsWith('/locations')) return 'Work Locations';
    
    if (apiPath.startsWith('/admin/reports') || apiPath.startsWith('/reports')) {
        return 'Reports & Summaries';
    }
    
    if (apiPath.startsWith('/super-admin/monitor')) {
        return 'System Monitor';
    }
    
    if (apiPath.startsWith('/super-admin')) {
        return 'Super Admin';
    }
    
    if (apiPath.startsWith('/admin')) {
        return 'Admin Portal';
    }
    
    return 'General';
}

export const apiMonitor = (req, res, next) => {
    // Record start time
    const startTime = process.hrtime();
    
    // Mask request body/query for privacy compliance
    const maskedBody = maskSensitiveFields(req.body);
    const maskedQuery = maskSensitiveFields(req.query);

    // Track original path (ignoring query strings)
    const requestPath = req.originalUrl.split('?')[0];

    // Listen to response finish event (fires when response is fully sent)
    res.on('finish', () => {
        // Calculate response duration in milliseconds
        const diff = process.hrtime(startTime);
        const durationMs = Math.round((diff[0] * 1e9 + diff[1]) / 1e6);

        // Capture user context (extracted downstream by authenticateJWT middleware)
        const userId = req.user?.id || req.user?.user_id || null;
        const orgId = req.user?.org_id || null;
        const userType = req.user?.user_type || 'anonymous';

        // Classify path into application module
        const moduleName = getModuleFromPath(requestPath);

        // Determine if request was a success or failure
        const isSuccess = res.statusCode >= 200 && res.statusCode < 400;

        // Skip standard high-frequency health checks to avoid noise
        if (requestPath === '/health' || requestPath === '/api/health') return;

        // Prepare standard log description
        const desc = `API ${req.method} ${requestPath} returned ${res.statusCode} ${res.statusMessage || ''} (${durationMs}ms)`;

        // Emit log event
        try {
            EventBus.emitActivityLog({
                user_id: userId,
                org_id: orgId,
                event_type: 'API_CALL',
                event_source: getEventSource(req), // WEB or MOBILE_APP platform classification
                object_type: moduleName,           // Module name classification
                object_id: null,
                request_ip: req.clientIp || req.ip || null,
                user_agent: req.headers['user-agent'] || null,
                location: null,
                description: desc,
                metadata: {
                    method: req.method,
                    path: req.originalUrl,
                    status_code: res.statusCode,
                    duration_ms: durationMs,
                    user_type: userType,
                    body: (maskedBody && typeof maskedBody === 'object' && Object.keys(maskedBody).length > 0) ? maskedBody : null,
                    query: (maskedQuery && typeof maskedQuery === 'object' && Object.keys(maskedQuery).length > 0) ? maskedQuery : null,
                    is_success: isSuccess
                }
            });
        } catch (err) {
            console.error('[API Monitor Error] Failed to emit log:', err);
        }
    });

    next();
};
