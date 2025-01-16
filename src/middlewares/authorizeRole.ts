import type { Request, Response, NextFunction } from "express";

type AuthorizationRule = {
  role: string;
  canAccessOthersData: boolean;
}

const AUTHORIZATION_RULES: AuthorizationRule[] = [
  { role: 'admin', canAccessOthersData: true },
  { role: 'user', canAccessOthersData: false }
];

export const authorizeRole = (allowedRoles: string[]) => {
  return (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const userRole = req.user?.roleName;
    const userIdFromToken = req.user?.id;
    const resourceUserId = req.resourceUserId;

    if (!userRole || !userIdFromToken) {
      res.status(401).json({ 
        error: "Authentication required",
        details: "User role or ID not found in token"
      });
      return
    }

    if (!allowedRoles.includes(userRole)) {
      res.status(403).json({ 
        error: "Access denied",
        details: "User role not authorized for this resource"
      });
      return
    }

    const userRuleSet = AUTHORIZATION_RULES.find(rule => rule.role === userRole);
    if (!userRuleSet) {
      res.status(500).json({ 
        error: "Authorization configuration error",
        details: "Role rules not found"
      });
      return
    }

    if (!userRuleSet.canAccessOthersData && resourceUserId && userIdFromToken !== resourceUserId) {
      res.status(403).json({ 
        error: "Access denied",
        details: "You can only access your own resources"
      });
      return
    }

    next();
  };
};
