"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeRole = void 0;
const AUTHORIZATION_RULES = [
    { role: 'admin', canAccessOthersData: true },
    { role: 'user', canAccessOthersData: false }
];
const authorizeRole = (allowedRoles) => {
    return (req, res, next) => {
        var _a, _b;
        const userRole = (_a = req.user) === null || _a === void 0 ? void 0 : _a.roleName;
        const userIdFromToken = (_b = req.user) === null || _b === void 0 ? void 0 : _b.id;
        const resourceUserId = req.resourceUserId;
        if (!userRole || !userIdFromToken) {
            res.status(401).json({
                error: "Authentication required",
                details: "User role or ID not found in token"
            });
            return;
        }
        if (!allowedRoles.includes(userRole)) {
            res.status(403).json({
                error: "Access denied",
                details: "User role not authorized for this resource"
            });
            return;
        }
        const userRuleSet = AUTHORIZATION_RULES.find(rule => rule.role === userRole);
        if (!userRuleSet) {
            res.status(500).json({
                error: "Authorization configuration error",
                details: "Role rules not found"
            });
            return;
        }
        if (!userRuleSet.canAccessOthersData && resourceUserId && userIdFromToken !== resourceUserId) {
            res.status(403).json({
                error: "Access denied",
                details: "You can only access your own resources"
            });
            return;
        }
        next();
    };
};
exports.authorizeRole = authorizeRole;
