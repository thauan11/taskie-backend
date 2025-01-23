import { Router } from 'express'
import {
  tokenValidation,
  loginUser,
  forgotPassword,
  resetPassword,
  resetTokenValidation,
} from '../controllers/loginController'
import { createUser } from '../controllers/userController'
import { validateUser } from '../middlewares/validateUser'

const router = Router()

// login
router.post('/login', loginUser)
// token validation
router.get('/auth-token', tokenValidation)
// register
router.post('/register', validateUser, createUser)
// pass recovery
router.post('/forgot-password', forgotPassword)
router.get('/reset-password-validation/:token', resetTokenValidation)
router.patch('/reset-password/:token', resetPassword)

export default router
