"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const loginController_1 = require("../controllers/loginController");
const userController_1 = require("../controllers/userController");
const validateUser_1 = require("../middlewares/validateUser");
const router = (0, express_1.Router)();
// login
router.post('/login', loginController_1.loginUser);
// token validation
router.get('/auth-token', loginController_1.tokenValidation);
// register
router.post('/register', validateUser_1.validateUser, userController_1.createUser);
// pass recovery
router.post('/forgot-password', loginController_1.forgotPassword);
router.get('/reset-password-validation/:token', loginController_1.resetTokenValidation);
router.patch('/reset-password/:token', loginController_1.resetPassword);
exports.default = router;
