import { Router } from 'express';
import { createUser } from '../controllers/userController';
import { validateUser } from '../middlewares/validateUser';

const router = Router();

router.post('/', validateUser, createUser);

export default router;
