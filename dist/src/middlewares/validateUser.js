"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateUser = void 0;
const zod_1 = require("zod");
const passwordSchema = zod_1.z.string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[\W_]/, 'Password must contain at least 1 special character')
    .regex(/[0-9].*[0-9].*[0-9]/, 'Password must contain at least 3 numbers')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter');
const userSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Name is required'),
    email: zod_1.z.string().email('Invalid email format'),
    // password: passwordSchema,
    password: zod_1.z.string().min(1, 'Password is required'),
});
const validateUser = (req, res, next) => {
    try {
        userSchema.parse(req.body);
        next();
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            const errorMessages = error.issues.map(issue => issue.message);
            res.status(400).json({ error: errorMessages[0] });
            return;
        }
        next(error);
    }
};
exports.validateUser = validateUser;
