import type { Request, Response, NextFunction } from 'express';

export const extractResourceUserId = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userIdParam = req.params.userId;
  if (userIdParam) {
    req.resourceUserId = userIdParam;
  }
  next();
};