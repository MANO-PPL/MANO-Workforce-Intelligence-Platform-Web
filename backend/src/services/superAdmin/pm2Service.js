import fs from 'fs';
import path from 'path';
import os from 'os';

// Production paths on Ubuntu EC2
const PROD_OUT_LOG = '/home/ubuntu/.pm2/logs/ATTENDANCE-BACKEND-out.log';
const PROD_ERR_LOG = '/home/ubuntu/.pm2/logs/ATTENDANCE-BACKEND-error.log';

// Local dev fallback paths (simulated logs in workspace)
const DEV_OUT_LOG = path.resolve('./backend-pm2-out.log');
const DEV_ERR_LOG = path.resolve('./backend-pm2-error.log');

export const getLogPaths = () => {
    try {
        if (fs.existsSync(PROD_OUT_LOG)) {
            return { out: PROD_OUT_LOG, err: PROD_ERR_LOG };
        }
    } catch (e) {}
    
    try {
        if (fs.existsSync(DEV_OUT_LOG)) {
            return { out: DEV_OUT_LOG, err: DEV_ERR_LOG };
        }
    } catch (e) {}
    
    return { out: null, err: null };
};

// Regex classification rules
const SEVERITY_RULES = {
    CRITICAL: /(error:|typeerror:|referenceerror:|syntaxerror:|uncaughtexception|unhandledrejection|fatal|crashed|app crashed|econnrefused|etimedout|enotfound)/i,
    WARNING: /(warning|warn|deprecated|slow query|timeout|disconnected|redis connection error|401 unauthorized|403 forbidden|token invalid|rate limit exceeded)/i,
    INFO: /(listening|connected|ready|initialized|200 ok|201 created|304 not modified|scheduled|scheduler)/i
};

const CATEGORY_RULES = {
    Database: /(knex|mysql|db_host|3306|3307|database|query|table initialization)/i,
    Cache_Queue: /(redis|bullmq|cache|6379|queue|job|worker|elasticache)/i,
    Security_Auth: /(auth|login|token|jwt|unauthorized|forbidden|otp|captcha|fcmService|security alert)/i,
    FCM_Push: /(fcm|firebase|push notification|registered devices|admin sdk)/i,
    API_Requests: /(get\s\/|post\s\/|put\s\/|delete\s\/|api_call|route path|status_code)/i
};

// Helper to classify log line
export const parseLogLine = (line, type = 'stdout') => {
    if (!line || line.trim() === '') return null;

    let timestamp = new Date().toISOString();
    let message = line;

    // PM2 and common loggers format: "YYYY-MM-DDTHH:mm:ss: message" or "[YYYY-MM-DD HH:mm:ss] message"
    const tsMatch = line.match(/^\[?(\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z?)\]?\s*(.*)/);
    if (tsMatch) {
        timestamp = new Date(tsMatch[1]).toISOString();
        message = tsMatch[2];
    }

    // Determine Severity
    let severity = 'INFO'; // default
    if (type === 'stderr') {
        severity = 'WARNING'; // Default stderr is warning unless critical keywords match
    }
    if (SEVERITY_RULES.CRITICAL.test(line)) {
        severity = 'CRITICAL';
    } else if (SEVERITY_RULES.WARNING.test(line)) {
        severity = 'WARNING';
    } else if (SEVERITY_RULES.INFO.test(line)) {
        severity = 'INFO';
    }

    // Determine Category
    let category = 'System'; // default
    for (const [key, regex] of Object.entries(CATEGORY_RULES)) {
        if (regex.test(line)) {
            category = key.replace('_', ' & '); // format nice name
            break;
        }
    }

    return {
        timestamp,
        message,
        severity,
        category,
        source: type === 'stderr' ? 'stderr' : 'stdout'
    };
};

// Memory-efficient reader for last N lines of a log file
const readLastLines = async (filePath, maxLines = 150) => {
    let fileHandle;
    try {
        if (!fs.existsSync(filePath)) return [];
        
        const stats = await fs.promises.stat(filePath);
        if (stats.size === 0) return [];

        fileHandle = await fs.promises.open(filePath, 'r');
        
        // Read last 128KB max (reasonable buffer size for 150 lines of logs)
        const bufferSize = Math.min(1024 * 128, stats.size);
        const buffer = Buffer.alloc(bufferSize);
        
        await fileHandle.read(buffer, 0, bufferSize, stats.size - bufferSize);
        
        const text = buffer.toString('utf8');
        const lines = text.split('\n').filter(l => l.trim() !== '');
        
        return lines.slice(-maxLines);
    } catch (err) {
        console.error(`[PM2 Service] Failed to read lines from ${filePath}:`, err);
        return [];
    } finally {
        if (fileHandle) {
            await fileHandle.close();
        }
    }
};

// Fetch combined history from stdout and stderr
export const getHistoryLogs = async (maxLines = 150) => {
    const paths = getLogPaths();
    if (!paths.out || !paths.err) {
        return [];
    }
    
    const [outLines, errLines] = await Promise.all([
        readLastLines(paths.out, maxLines),
        readLastLines(paths.err, maxLines)
    ]);

    const parsedOut = outLines.map(line => parseLogLine(line, 'stdout')).filter(Boolean);
    const parsedErr = errLines.map(line => parseLogLine(line, 'stderr')).filter(Boolean);

    // Merge and sort chronologically by timestamp
    const combined = [...parsedOut, ...parsedErr].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    // Return the last N logs of the merged array
    return combined.slice(-maxLines);
};
