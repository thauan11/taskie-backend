"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractResourceUserId = void 0;
const extractResourceUserId = (req, res, next) => {
    const userIdParam = req.params.userId;
    if (userIdParam) {
        req.resourceUserId = userIdParam;
    }
    next();
};
exports.extractResourceUserId = extractResourceUserId;
