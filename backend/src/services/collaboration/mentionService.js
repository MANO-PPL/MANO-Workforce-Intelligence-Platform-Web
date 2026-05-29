import { attendanceDB } from '../../config/database.js';
import { createNotification } from '../notifications/notificationService.js';
import { encryptText, decryptText } from '../../utils/encryption.js';


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
            } else if (context_type === 'dar_meeting') {
                title = 'Mentioned in Meeting';
                message = `${senderName} tagged you in a Daily Activity Report meeting.`;
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

            // Instagram-like mention preview chat message creation (without emojis)
            if (context_type === 'dar_activity' || context_type === 'dar_meeting') {
                try {
                    const finalOrgId = org_id || 1;

                    // 1. Try to find an existing direct chat room between sender_id and userId
                    const allRooms = await attendanceDB('chat_rooms')
                        .where({ room_type: 'direct', org_id: finalOrgId });

                    let room = allRooms.find(r => {
                        try {
                            const ids = typeof r.member_ids === 'string' ? JSON.parse(r.member_ids) : r.member_ids;
                            return Array.isArray(ids) &&
                                   ids.map(Number).includes(Number(sender_id)) &&
                                   ids.map(Number).includes(Number(userId));
                        } catch (e) {
                            return false;
                        }
                    });

                    let roomId;
                    let existingMessages = [];

                    if (room) {
                        roomId = room.room_id;
                        try {
                            const decrypted = decryptText(room.messages);
                            existingMessages = typeof decrypted === 'string' ? JSON.parse(decrypted || '[]') : (decrypted || []);
                        } catch (e) {
                            existingMessages = [];
                        }
                    } else {
                        // Create a new direct chat room between the two users
                        const memberIds = [Number(sender_id), Number(userId)].sort((a, b) => a - b);
                        const [insertedId] = await attendanceDB('chat_rooms').insert({
                            org_id: finalOrgId,
                            room_name: null,
                            room_type: 'direct',
                            created_by: sender_id,
                            member_ids: JSON.stringify(memberIds),
                            messages: encryptText(JSON.stringify([])),
                            last_read_times: JSON.stringify({}),
                            created_at: attendanceDB.fn.now(),
                            updated_at: attendanceDB.fn.now()
                        });
                        roomId = insertedId;
                    }

                    // 2. Fetch the task/meeting details
                    let mentionTitle = '';
                    let mentionDesc = '';

                    if (context_type === 'dar_activity') {
                        const activity = await attendanceDB('daily_activities')
                            .where({ activity_id: context_id })
                            .first();
                        if (activity) {
                            mentionTitle = activity.title || 'Untitled Task';
                            mentionDesc = activity.description || '';
                        }
                    } else if (context_type === 'dar_meeting') {
                        const event = await attendanceDB('events_meetings')
                            .where({ event_id: context_id })
                            .first();
                        if (event) {
                            mentionTitle = event.title || 'Untitled Meeting';
                            mentionDesc = event.description || '';
                        }
                    }

                    // 3. Format message cleanly without emojis
                    const displayTitle = mentionTitle ? `*${mentionTitle.toUpperCase()}*` : 'Untitled';
                    const displayDesc = mentionDesc ? `\n"${mentionDesc}"` : '';
                    const contextName = context_type === 'dar_activity' ? 'Daily Activity Task' : 'Daily Activity Meeting';
                    const chatMessageText = `Mentioned you in my ${contextName}:\n${displayTitle}${displayDesc}`;

                    // 4. Create and append the message
                    const messageId = Date.now() + Math.floor(Math.random() * 1000);
                    const newMsg = {
                        message_id: messageId,
                        sender_id: Number(sender_id),
                        message_text: chatMessageText,
                        created_at: new Date().toISOString()
                    };

                    const updatedMessages = [...existingMessages, newMsg];
                    await attendanceDB('chat_rooms')
                        .where({ room_id: roomId })
                        .update({
                            messages: encryptText(JSON.stringify(updatedMessages)),
                            updated_at: attendanceDB.fn.now()
                        });

                    // 5. Emit real-time WebSocket update event
                    if (io) {
                        const sender = await attendanceDB('users')
                            .where({ user_id: sender_id })
                            .select('user_name', 'profile_image_url')
                            .first();

                        const formattedResponseMsg = {
                            message_id: messageId,
                            room_id: Number(roomId),
                            sender_id: Number(sender_id),
                            message_text: chatMessageText,
                            created_at: newMsg.created_at,
                            user_name: sender ? sender.user_name : 'Unknown Colleague',
                            profile_image_url: sender ? sender.profile_image_url : null
                        };

                        io.to(`room_${roomId}`).emit('message_received', formattedResponseMsg);
                        io.to(`user_${sender_id}`).emit('room_updated', { room_id: roomId });
                        io.to(`user_${userId}`).emit('room_updated', { room_id: roomId });
                    }
                } catch (chatErr) {
                    console.error('Error creating mention preview chat message:', chatErr);
                }
            }

            results.push({ user_id: userId, notification_id: notificationId });
        }

        return results;
    } catch (err) {
        return [];
    }
};
