import express from 'express';
import { sendMessage, getMessages, markAsRead } from '../controllers/messageController.js';
import { protect } from '../middleware/auth.js';
import { validateMessage, handleValidationErrors } from '../middleware/validation.js';

const router = express.Router();

router.use(protect); // All routes are protected

router.post('/', validateMessage, handleValidationErrors, sendMessage);
router.get('/:userId', getMessages);
router.put('/read/:conversationId', markAsRead);

export default router;
