import express from 'express';
import { getUsers, getUserById, updateProfile, getConversations, searchUsers } from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect); // All routes are protected

router.get('/', getUsers);
router.get('/conversations', getConversations);
router.get('/search', searchUsers);
router.get('/:id', getUserById);
router.put('/profile', updateProfile);

export default router;
