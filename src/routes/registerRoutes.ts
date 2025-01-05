import { Router } from 'express';
import { createUser } from '../controllers/userController';
import { validateNewUser } from '../middlewares/validateUser';

const router = Router();

router.post('/', validateNewUser, createUser);

export default router;
