import express from 'express';
import { authenticateJWT, requireActiveOrg } from '../../middleware/auth.js';
import * as chatController from '../../controllers/collaboration/chatController.js';

const router = express.Router();

// All collaboration paths require a valid organization and authenticated token session
router.use(authenticateJWT, requireActiveOrg);

// Directory list for auto-complete & chat targets
router.get('/users', chatController.getOrgUsers);

// Rooms endpoints
router.get('/rooms', chatController.getRooms);
router.post('/rooms', chatController.createRoom);

// Message logs & sending endpoints
router.get('/rooms/:roomId/messages', chatController.getRoomMessages);
router.post('/rooms/:roomId/messages', chatController.sendMessage);

// Message read marker updates
router.put('/rooms/:roomId/read', chatController.markAsRead);

// Delete room (clears the entire conversation row)
router.delete('/rooms/:roomId', chatController.deleteRoom);

export default router;
