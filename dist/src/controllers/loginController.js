"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPassword = exports.forgotPassword = exports.resetTokenValidation = exports.tokenValidation = exports.loginUser = void 0;
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const sgMail = require('@sendgrid/mail');
const prisma = new client_1.PrismaClient();
const loginUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password, rememberMe } = req.body;
    const user = yield prisma.user.findUnique({
        where: { email },
        include: { role: true },
    });
    if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
    }
    const isPasswordValid = yield bcrypt_1.default.compare(password, user.password);
    if (!isPasswordValid) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
    }
    const expiresIn = rememberMe ? '30d' : '1d';
    const token = jsonwebtoken_1.default.sign({
        id: user.id,
        email: user.email,
        name: user.name,
        roleName: user.role.name,
    }, process.env.JWT_SECRET, { expiresIn });
    res.cookie('authToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENVIRONMENT === 'prod',
        sameSite: 'strict',
        maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000,
    });
    res.status(200).json({ message: 'Login successful' });
});
exports.loginUser = loginUser;
const tokenValidation = (req, res) => {
    const token = req.cookies.authToken;
    if (!token) {
        res.status(401).json({ message: 'Token not provided' });
        return;
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const { id, email, name, roleName } = decoded;
        res.status(200).json({ user: { id, email, name, roleName } });
    }
    catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
};
exports.tokenValidation = tokenValidation;
const resetTokenValidation = (req, res) => {
    const { token } = req.params;
    if (!token) {
        res.status(401).json({ message: 'Token not provided' });
        return;
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        if (!decoded || !decoded.id) {
            res.status(400).json({ error: 'Invalid or expired token' });
            return;
        }
        res.status(200).json({ message: 'Token is valid' });
    }
    catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
};
exports.resetTokenValidation = resetTokenValidation;
const forgotPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = req.body;
    const user = yield prisma.user.findUnique({ where: { email } });
    if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
    }
    const token = jsonwebtoken_1.default.sign({ id: user.id }, process.env.JWT_SECRET, {
        expiresIn: '5m',
    });
    // sendgrid
    const sendgridKey = sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    if (!sendgridKey) {
        res.status(403).json({ error: 'Sendgrid key not provided' });
        return;
    }
    const mail = {
        to: user.email,
        from: 'Taskie <recovery.taskie@gmail.com>',
        // from: 'recovery.taskie@gmail.com',
        subject: 'Reset your password',
        html: `
      <!DOCTYPE html>
      <html style="background-color: #171717; color: #ededed; font-family: Arial, sans-serif; display: grid; place-items: center; height: 100%;">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Password</title>
      </head>
      <body style="margin: 0; padding: 0; color: #ededed; font-family: Arial, sans-serif; ">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td align="center" style="padding: 20px 0;">
              <table cellpadding="0" cellspacing="0" border="0" style="max-width: 300px; background-color: #27272A; border-radius: 8px; padding: 24px;">
                <tr>
                  <td align="center">
                    <img src="https://i.imgur.com/rXjBH88.png" alt="Logo" style="width: 80px; height: auto;">
                  </td>
                </tr>
                <tr>
                  <td style="text-align: center;">
                    <h1 style="font-size: 24px; margin-bottom: 20px; color: #ededed">Reset your password</h1>
                    <p style="font-size: 16px; margin-bottom: 20px; color: #ededed">Click the button below to reset your password:</p>
                    <a href="${process.env.CLIENT_URL}/reset-password/${token}" style="display: inline-block; background-color: #F9C52B; color: #27272A; text-decoration: none; padding: 12px 24px; border-radius: 5px; font-weight: bold;">Reset password</a>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding: 20px 0; font-size: 12px; color: #ededed;">
                    If you did not request a password reset, please ignore this email.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
    };
    try {
        yield sgMail.send(mail);
        res.status(200).json({ message: 'Reset link sent to your email' });
    }
    catch (error) {
        console.error('SendGrid Error:', error);
        res.status(500).json({ error: 'Failed to send email' });
    }
});
exports.forgotPassword = forgotPassword;
const resetPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { token } = req.params;
    const { password } = req.body;
    if (!token) {
        res.status(400).json({ error: 'Token not provided' });
        return;
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        if (!decoded || !decoded.id) {
            res.status(400).json({ error: 'Invalid or expired token' });
            return;
        }
        const hashedPassword = yield bcrypt_1.default.hash(password, 10);
        yield prisma.user.update({
            where: { id: decoded.id },
            data: { password: hashedPassword },
        });
        res.status(200).json({ message: 'Password updated successfully' });
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            res.status(401).json({ error: 'Token has expired. Please request a new password reset.' });
            return;
        }
        console.error('Error resetting password:', error);
        res.status(500).json({ error: 'Failed to reset password' });
    }
});
exports.resetPassword = resetPassword;
