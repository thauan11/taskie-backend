"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authenticateToken = (req, res, next) => {
    var _a;
    const token = (_a = req.cookies) === null || _a === void 0 ? void 0 : _a.authToken;
    if (!token) {
        res.status(401).json({
            error: 'Authentication required',
            details: 'No token provided'
        });
        return;
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            res.status(401).json({
                error: 'Authentication required',
                details: 'Token expired'
            });
            return;
        }
        res.status(403).json({
            error: 'Invalid token',
            details: 'Token verification failed'
        });
        return;
    }
};
exports.authenticateToken = authenticateToken;
