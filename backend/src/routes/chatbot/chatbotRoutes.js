import express from 'express';
import { askWebsiteChatbot } from '../../controllers/chatbot/chatbotController.js';

const router = express.Router();

router.post('/ask', askWebsiteChatbot);

export default router;
