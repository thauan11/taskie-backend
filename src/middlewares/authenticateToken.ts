import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import type { DecodedToken } from '../types/express';

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.cookies?.authToken;

  if (!token) {
    res.status(401).json({ 
      error: 'Authentication required',
      details: 'No token provided'
    });
    return
  }

  try {
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET as string
    ) as DecodedToken;

    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ 
        error: 'Authentication required',
        details: 'Token expired'
      });
      return
    }

    res.status(403).json({ 
      error: 'Invalid token',
      details: 'Token verification failed'
    });
    return
  }
};