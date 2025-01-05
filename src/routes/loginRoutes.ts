import { Router } from 'express';
import { tokenValidation, loginUser } from '../controllers/loginController';

const router = Router();

router.post('/', loginUser);
router.get('/auth-token', tokenValidation);

export default router;
