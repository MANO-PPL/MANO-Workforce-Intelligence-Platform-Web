import { attendanceDB } from '../../config/database.js';
import { createNotification } from '../notifications/notificationService.js';

/**
 * Parses and processes `@mentions` within chat texts or DAR descriptions.
 */
export const handleMentions = async ({ org_id, sender_id, text, context_type, context_id, explicit_user_ids = [], room_id, io }) => {
    try {
        if (!text || typeof text !== 'string') return [];

        const sender = await attendanceDB('users')
            .where({ user_id: sender_id })
            .select('user_name')
            .first();
        const senderName = sender?.user_name || 'Someone';

        const mentionedUserIds = new Set(explicit_user_ids);

        let allowedMemberIds = null;
        if (context_type === 'chat_message' && room_id) {
            const room = await attendanceDB('chat_rooms')
                .where({ room_id })
                .first();
            if (room) {
                const parsedIds = typeof room.member_ids === 'string' ? JSON.parse(room.member_ids) : room.member_ids;
                if (Array.isArray(parsedIds)) {
                    allowedMemberIds = parsedIds.map(Number);
                }
            }
        }

        // Fetch active coworkers in the organization (optionally filtered by org_id)
        let orgUsersQuery = attendanceDB('users')
            .where({ 'users.is_deleted': 0, 'users.is_active': 1 })
            .whereNot({ 'users.user_id': sender_id });

        if (org_id !== null && org_id !== undefined) {
            orgUsersQuery = orgUsersQuery.where({ 'users.org_id': org_id });
        }

        if (allowedMemberIds) {
            orgUsersQuery = orgUsersQuery.whereIn('users.user_id', allowedMemberIds);
        }

        const orgUsers = await orgUsersQuery.select('users.user_id', 'users.user_name');

        // Regex to find mentions (e.g. @John Doe)
        const mentionRegex = /@([a-zA-Z0-9\s._-]+)/g;
        let match;
        while ((match = mentionRegex.exec(text)) !== null) {
            const rawMention = match[1].trim().toLowerCase();
            
            // Look for matching user names (trim trailing/leading spaces from DB names)
            const matchedUser = orgUsers.find(u => {
                const name = (u.user_name || '').trim().toLowerCase();
                return name === rawMention || rawMention.startsWith(name);
            });

            if (matchedUser) {
                mentionedUserIds.add(matchedUser.user_id);
            }
        }

        const results = [];
        for (const userId of mentionedUserIds) {
            let title = 'New Mention';
            let message = `${senderName} mentioned you.`;

            if (context_type === 'chat_message') {
                title = 'Mentioned in Chat';
                message = `${senderName} mentioned you in a chat message.`;
            } else if (context_type === 'dar_activity') {
                title = 'Mentioned in DAR';
                message = `${senderName} tagged you in their Daily Activity Report task.`;
            }

            const notificationId = await createNotification({
                org_id,
                user_id: userId,
                type: 'INFO',
                title,
                message,
                related_entity_type: context_type,
                related_entity_id: String(context_id)
            });

            // Emit real-time notification event if WebSocket engine is attached
            if (io) {
                io.to(`user_${userId}`).emit('new_notification', {
                    notification_id: notificationId,
                    org_id,
                    user_id: userId,
                    type: 'INFO',
                    title,
                    message,
                    is_read: 0,
                    related_entity_type: context_type,
                    related_entity_id: String(context_id),
                    created_at: new Date().toISOString()
                });
            }

            results.push({ user_id: userId, notification_id: notificationId });
        }

        return results;
    } catch (err) {
        return [];
    }
};
