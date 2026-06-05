import { attendanceDB } from '../../config/database.js';
import AppError from '../../utils/AppError.js';
import { getFileUrl } from '../../services/s3/s3Service.js';
import { getHistoryLogs } from '../../services/superAdmin/pm2Service.js';

// --- Security Alerts ---
export const getSecurityAlerts = async (req, res, next) => {
    try {
        const alerts = await attendanceDB('security_alerts')
            .leftJoin('users', 'security_alerts.user_id', 'users.user_id')
            .leftJoin('organizations', 'security_alerts.org_id', 'organizations.org_id')
            .select(
                'security_alerts.*',
                'users.user_name', 'users.email',
                'organizations.org_name'
            )
            .orderBy('security_alerts.created_at', 'desc');

        res.status(200).json({ status: 'success', data: alerts });
    } catch (error) {
        next(error);
    }
};

export const updateSecurityAlertStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'open', 'resolved'

        if (!['open', 'resolved'].includes(status)) {
            throw new AppError("Status must be 'open' or 'resolved'", 400);
        }

        const affected = await attendanceDB('security_alerts')
            .where({ id })
            .update({ status });

        if (affected === 0) throw new AppError("Security alert not found", 404);

        res.status(200).json({ status: 'success', message: 'Alert status updated successfully' });
    } catch (error) {
        next(error);
    }
};

// --- User Feedback ---
export const getUserFeedback = async (req, res, next) => {
    try {
        const feedback = await attendanceDB('feedback')
            .leftJoin('users', 'feedback.user_id', 'users.user_id')
            .leftJoin('organizations', 'users.org_id', 'organizations.org_id')
            .select(
                'feedback.*',
                'users.user_name', 'users.email',
                'organizations.org_name', 'organizations.org_id'
            )
            .orderBy('feedback.created_at', 'desc');

        // Fetch attachments for all feedback
        const feedbackIds = feedback.map(f => f.feedback_id);
        let attachments = [];
        if (feedbackIds.length > 0) {
            attachments = await attendanceDB('feedback_attachments')
                .whereIn('feedback_id', feedbackIds)
                .select('attachment_id', 'feedback_id', 'file_name', 'file_key', 'file_type');
        }

        // Generate map of attachments
        const feedbackAttachmentsMap = {};
        for (const attachment of attachments) {
            if (!feedbackAttachmentsMap[attachment.feedback_id]) {
                feedbackAttachmentsMap[attachment.feedback_id] = [];
            }
            let url = null;
            try {
                if (attachment.file_key) {
                    const res = await getFileUrl({ key: attachment.file_key });
                    if (res.success) url = res.url;
                }
            } catch (err) { }

            feedbackAttachmentsMap[attachment.feedback_id].push({
                ...attachment,
                url
            });
        }

        // Stitch attachments
        const feedbackWithAttachments = feedback.map(f => ({
            ...f,
            attachments: feedbackAttachmentsMap[f.feedback_id] || []
        }));

        res.status(200).json({ status: 'success', data: feedbackWithAttachments });
    } catch (error) {
        next(error);
    }
};

export const updateFeedbackStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'pending', 'reviewed', 'resolved'

        if (!['pending', 'reviewed', 'resolved'].includes(status)) {
            throw new AppError("Invalid feedback status", 400);
        }

        const affected = await attendanceDB('feedback')
            .where({ feedback_id: id })
            .update({ status, updated_at: attendanceDB.fn.now() });

        if (affected === 0) throw new AppError("Feedback not found", 404);

        res.status(200).json({ status: 'success', message: 'Feedback status updated successfully' });
    } catch (error) {
        next(error);
    }
};

// Helper to classify Express route path to specific application module
const getModuleFromPath = (path) => {
    if (!path) return 'General';
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
};

// --- PM2 Logs Console ---
export const getPM2Logs = async (req, res, next) => {
    try {
        const limit = Number(req.query.limit) || 150;
        const logs = await getHistoryLogs(limit);
        res.status(200).json({ status: 'success', data: logs });
    } catch (error) {
        next(error);
    }
};
