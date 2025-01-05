import type { Request, Response, NextFunction } from 'express';
import { z } from "zod";

const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters long')
  .regex(/[\W_]/, 'Password must contain at least 1 special character')
  .regex(/[0-9].*[0-9].*[0-9]/, 'Password must contain at least 3 numbers')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter');

const userSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  email: z.string().email('Invalid email format'),
  password: passwordSchema,
})

export const validateNewUser = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    userSchema.parse(req.body);
    
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues.map(issue => issue.message);
      res.status(400).json({ error: errorMessages[0] });
      return;
    }

    next(error);
  }
};
