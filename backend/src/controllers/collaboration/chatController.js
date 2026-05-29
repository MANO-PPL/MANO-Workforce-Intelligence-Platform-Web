import { attendanceDB } from '../../config/database.js';
import catchAsync from '../../utils/catchAsync.js';
import AppError from '../../utils/AppError.js';
import { handleMentions } from '../../services/collaboration/mentionService.js';
import { encryptText, decryptText } from '../../utils/encryption.js';

// GET sanitized coworkers inside same organization
export const getOrgUsers = catchAsync(async (req, res, next) => {
    const orgId = req.user.org_id;
    const currentUserId = req.user.user_id ?? req.user.id;
    const isSuperAdmin = req.user.user_type === 'super_admin';

    let query = attendanceDB('users')
        .leftJoin('departments', 'users.dept_id', 'departments.dept_id')
        .leftJoin('designations', 'users.desg_id', 'designations.desg_id')
        .where('users.is_deleted', 0)
        .where('users.is_active', 1)
        .whereNot('users.user_id', currentUserId);

    if (!isSuperAdmin && orgId !== null && orgId !== undefined) {
        query = query.where('users.org_id', orgId);
    }

    const users = await query
        .select(
            'users.user_id',
            'users.user_name',
            'users.email',
            'users.user_type',
            'users.profile_image_url',
            'departments.dept_name',
            'designations.desg_name'
        )
        .orderBy('users.user_name', 'asc');

    // Trim user names to clean up leading/trailing whitespaces
    const cleanUsers = users.map(u => ({
        ...u,
        user_name: u.user_name ? u.user_name.trim() : ''
    }));

    res.json({
        success: true,
        data: cleanUsers
    });
});

// GET all rooms current user is a member of
export const getRooms = catchAsync(async (req, res, next) => {
    const userId = req.user.user_id ?? req.user.id;
    const orgId = req.user.org_id;
    const isSuperAdmin = req.user.user_type === 'super_admin';

    // Fetch all rooms (bypass org_id filter if super admin)
    let query = attendanceDB('chat_rooms');
    if (!isSuperAdmin && orgId !== null && orgId !== undefined) {
        query = query.where({ org_id: orgId });
    }
    const allRooms = await query;

    // Filter in memory for rooms containing current user in member_ids JSON array
    const userRooms = allRooms.filter(room => {
        try {
            const memberIds = typeof room.member_ids === 'string' ? JSON.parse(room.member_ids) : room.member_ids;
            return Array.isArray(memberIds) && memberIds.map(Number).includes(Number(userId));
        } catch (e) {
            return false;
        }
    });

    if (userRooms.length === 0) {
        return res.json({ success: true, data: [] });
    }

    // Get all unique member user IDs across all user rooms
    const allMemberIds = Array.from(new Set(userRooms.flatMap(room => {
        try {
            const memberIds = typeof room.member_ids === 'string' ? JSON.parse(room.member_ids) : room.member_ids;
            return Array.isArray(memberIds) ? memberIds.map(Number) : [];
        } catch (e) {
            return [];
        }
    })));

    // Fetch details of all room members in a single query
    const membersList = await attendanceDB('users')
        .leftJoin('departments', 'users.dept_id', 'departments.dept_id')
        .leftJoin('designations', 'users.desg_id', 'designations.desg_id')
        .whereIn('users.user_id', allMemberIds)
        .where('users.is_deleted', 0)
        .select(
            'users.user_id',
            'users.user_name',
            'users.profile_image_url',
            'users.email',
            'departments.dept_name',
            'designations.desg_name'
        );

    const enrichedRooms = [];

    for (const room of userRooms) {
        let roomMembers = [];
        try {
            const memberIds = typeof room.member_ids === 'string' ? JSON.parse(room.member_ids) : room.member_ids;
            roomMembers = membersList.filter(m => memberIds.map(Number).includes(Number(m.user_id)));
        } catch (e) {
            // Ignore
        }

        // Get user last read timestamp
        let lastReadAt = null;
        try {
            const readTimes = typeof room.last_read_times === 'string' ? JSON.parse(room.last_read_times || '{}') : (room.last_read_times || {});
            lastReadAt = readTimes[userId] ? new Date(readTimes[userId]) : null;
        } catch (e) {
            // Ignore
        }

        // Retrieve messages JSON array
        let msgs = [];
        try {
            const decryptedMessages = decryptText(room.messages);
            msgs = typeof decryptedMessages === 'string' ? JSON.parse(decryptedMessages || '[]') : (decryptedMessages || []);
        } catch (e) {
            // Ignore
        }

        // Calculate unread count
        const unreadCount = msgs.filter(msg => 
            Number(msg.sender_id) !== Number(userId) && 
            (!lastReadAt || new Date(msg.created_at) > lastReadAt)
        ).length;

        const lastMsg = msgs.length > 0 ? msgs[msgs.length - 1] : null;

        let customRoomName = decryptText(room.room_name);
        let dmAvatar = null;

        if (room.room_type === 'direct') {
            const otherMember = roomMembers.find(m => Number(m.user_id) !== Number(userId));
            if (otherMember) {
                customRoomName = otherMember.user_name;
                dmAvatar = otherMember.profile_image_url;
            }
        }

        enrichedRooms.push({
            ...room,
            room_name: customRoomName,
            avatar_url: dmAvatar,
            members: roomMembers,
            last_message: lastMsg ? {
                text: lastMsg.message_text,
                sender_id: lastMsg.sender_id,
                created_at: lastMsg.created_at
            } : null,
            unread_count: unreadCount
        });
    }

    // Sort rooms by last message timestamp (or creation timestamp if empty)
    enrichedRooms.sort((a, b) => {
        const timeA = a.last_message ? new Date(a.last_message.created_at) : new Date(a.created_at);
        const timeB = b.last_message ? new Date(b.last_message.created_at) : new Date(b.created_at);
        return timeB - timeA;
    });

    res.json({
        success: true,
        data: enrichedRooms
    });
});

// CREATE DM or Group room
export const createRoom = catchAsync(async (req, res, next) => {
    const userId = req.user.user_id ?? req.user.id;
    const orgId = req.user.org_id;
    const { room_type = 'direct', room_name, member_ids = [] } = req.body;

    const allMemberIds = Array.from(new Set([userId, ...member_ids])).map(Number);

    // Resolve room's orgId dynamically (required if creator is super admin and has null orgId)
    let finalOrgId = orgId;
    if (!finalOrgId) {
        const otherMembers = allMemberIds.filter(id => Number(id) !== Number(userId));
        if (otherMembers.length > 0) {
            const memberUser = await attendanceDB('users')
                .whereIn('user_id', otherMembers)
                .whereNotNull('org_id')
                .select('org_id')
                .first();
            if (memberUser) {
                finalOrgId = memberUser.org_id;
            }
        }
    }
    if (!finalOrgId) {
        finalOrgId = 1; // Fallback default
    }

    if (room_type === 'direct') {
        if (allMemberIds.length !== 2) {
            throw new AppError('Direct messaging rooms must have exactly 2 members', 400);
        }

        const targetMemberId = allMemberIds.find(id => id !== userId);

        // Check if DM room already exists between these 2 users
        const allRooms = await attendanceDB('chat_rooms')
            .where({ room_type: 'direct', org_id: finalOrgId });

        const existingDM = allRooms.find(room => {
            try {
                const ids = typeof room.member_ids === 'string' ? JSON.parse(room.member_ids) : room.member_ids;
                return Array.isArray(ids) && 
                       ids.map(Number).includes(Number(userId)) && 
                       ids.map(Number).includes(Number(targetMemberId));
            } catch (e) {
                return false;
            }
        });

        if (existingDM) {
            existingDM.room_name = decryptText(existingDM.room_name);
            try {
                const decryptedMessages = decryptText(existingDM.messages);
                existingDM.messages = typeof decryptedMessages === 'string' ? JSON.parse(decryptedMessages || '[]') : (decryptedMessages || []);
            } catch (e) {
                existingDM.messages = [];
            }
            return res.json({
                success: true,
                message: 'DM room already exists',
                data: existingDM
            });
        }
    }

    const [roomId] = await attendanceDB('chat_rooms').insert({
        org_id: finalOrgId,
        room_name: room_type === 'group' ? encryptText(room_name || 'Group Chat') : null,
        room_type,
        created_by: userId,
        member_ids: JSON.stringify(allMemberIds),
        messages: encryptText(JSON.stringify([])),
        last_read_times: JSON.stringify({}),
        created_at: attendanceDB.fn.now(),
        updated_at: attendanceDB.fn.now()
    });

    const newRoom = await attendanceDB('chat_rooms').where({ room_id: roomId }).first();

    if (newRoom) {
        newRoom.room_name = decryptText(newRoom.room_name);
        try {
            const decryptedMessages = decryptText(newRoom.messages);
            newRoom.messages = typeof decryptedMessages === 'string' ? JSON.parse(decryptedMessages || '[]') : (decryptedMessages || []);
        } catch (e) {
            newRoom.messages = [];
        }
    }

    res.status(201).json({
        success: true,
        data: newRoom
    });
});

// GET messages within a room
export const getRoomMessages = catchAsync(async (req, res, next) => {
    const userId = req.user.user_id ?? req.user.id;
    const { roomId } = req.params;

    const room = await attendanceDB('chat_rooms')
        .where({ room_id: roomId })
        .first();

    if (!room) {
        throw new AppError('Chat room not found', 404);
    }

    let memberIds = [];
    try {
        memberIds = typeof room.member_ids === 'string' ? JSON.parse(room.member_ids) : room.member_ids;
    } catch (e) {
        // Ignore
    }

    if (!Array.isArray(memberIds) || !memberIds.map(Number).includes(Number(userId))) {
        throw new AppError('You are not a member of this chat room', 403);
    }

    let msgs = [];
    try {
        const decryptedMessages = decryptText(room.messages);
        msgs = typeof decryptedMessages === 'string' ? JSON.parse(decryptedMessages || '[]') : (decryptedMessages || []);
    } catch (e) {
        // Ignore
    }

    // Resolve sender profiles
    const members = await attendanceDB('users')
        .whereIn('user_id', memberIds)
        .select('user_id', 'user_name', 'profile_image_url');

    const enrichedMessages = msgs.map(msg => {
        const sender = members.find(m => Number(m.user_id) === Number(msg.sender_id));
        return {
            message_id: msg.message_id,
            room_id: Number(roomId),
            sender_id: Number(msg.sender_id),
            message_text: msg.message_text,
            created_at: msg.created_at,
            user_name: sender ? sender.user_name : 'Unknown Colleague',
            profile_image_url: sender ? sender.profile_image_url : null
        };
    });

    res.json({
        success: true,
        data: enrichedMessages
    });
});

// POST message
export const sendMessage = catchAsync(async (req, res, next) => {
    const userId = req.user.user_id ?? req.user.id;
    const orgId = req.user.org_id;
    const { roomId } = req.params;
    const { message_text } = req.body;

    if (!message_text || message_text.trim() === '') {
        throw new AppError('Message text cannot be empty', 400);
    }

    const room = await attendanceDB('chat_rooms')
        .where({ room_id: roomId })
        .first();

    if (!room) {
        throw new AppError('Chat room not found', 404);
    }

    let memberIds = [];
    try {
        memberIds = typeof room.member_ids === 'string' ? JSON.parse(room.member_ids) : room.member_ids;
    } catch (e) {
        // Ignore
    }

    if (!Array.isArray(memberIds) || !memberIds.map(Number).includes(Number(userId))) {
        throw new AppError('You are not a member of this chat room', 403);
    }

    let msgs = [];
    try {
        const decryptedMessages = decryptText(room.messages);
        msgs = typeof decryptedMessages === 'string' ? JSON.parse(decryptedMessages || '[]') : (decryptedMessages || []);
    } catch (e) {
        // Ignore
    }

    const messageId = Date.now();
    const newMsg = {
        message_id: messageId,
        sender_id: Number(userId),
        message_text: message_text.trim(),
        created_at: new Date().toISOString()
    };

    const updatedMessages = [...msgs, newMsg];
    await attendanceDB('chat_rooms')
        .where({ room_id: roomId })
        .update({
            messages: encryptText(JSON.stringify(updatedMessages)),
            updated_at: attendanceDB.fn.now()
        });

    const sender = await attendanceDB('users')
        .where({ user_id: userId })
        .select('user_name', 'profile_image_url')
        .first();

    const formattedResponseMsg = {
        message_id: messageId,
        room_id: Number(roomId),
        sender_id: Number(userId),
        message_text: message_text.trim(),
        created_at: newMsg.created_at,
        user_name: sender ? sender.user_name : 'Unknown Colleague',
        profile_image_url: sender ? sender.profile_image_url : null
    };

    const io = req.app.get('io');
    if (io) {
        io.to(`room_${roomId}`).emit('message_received', formattedResponseMsg);
    }

    await handleMentions({
        org_id: room.org_id,
        sender_id: userId,
        text: message_text,
        context_type: 'chat_message',
        context_id: messageId,
        room_id: roomId,
        io
    });

    res.status(201).json({
        success: true,
        data: formattedResponseMsg
    });
});

// PUT mark room as read
export const markAsRead = catchAsync(async (req, res, next) => {
    const userId = req.user.user_id ?? req.user.id;
    const { roomId } = req.params;

    const room = await attendanceDB('chat_rooms')
        .where({ room_id: roomId })
        .first();

    if (!room) {
        throw new AppError('Chat room not found', 404);
    }

    let readTimes = {};
    try {
        readTimes = typeof room.last_read_times === 'string' ? JSON.parse(room.last_read_times || '{}') : (room.last_read_times || {});
    } catch (e) {
        // Ignore
    }

    readTimes[userId] = new Date().toISOString();

    await attendanceDB('chat_rooms')
        .where({ room_id: roomId })
        .update({
            last_read_times: JSON.stringify(readTimes)
        });

    res.json({
        success: true,
        message: 'Room messages marked as read'
    });
});

// DELETE chat room (deletes single row from database)
export const deleteRoom = catchAsync(async (req, res, next) => {
    const userId = req.user.user_id ?? req.user.id;
    const { roomId } = req.params;

    const room = await attendanceDB('chat_rooms')
        .where({ room_id: roomId })
        .first();

    if (!room) {
        throw new AppError('Chat room not found', 404);
    }

    let memberIds = [];
    try {
        memberIds = typeof room.member_ids === 'string' ? JSON.parse(room.member_ids) : room.member_ids;
    } catch (e) {
        // Ignore
    }

    if (!Array.isArray(memberIds) || !memberIds.map(Number).includes(Number(userId))) {
        throw new AppError('You are not a member of this chat room', 403);
    }

    // Delete the single chat_rooms row
    await attendanceDB('chat_rooms')
        .where({ room_id: roomId })
        .del();

    res.json({
        success: true,
        message: 'Chat room and all history deleted successfully'
    });
});
