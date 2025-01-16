export interface DecodedToken {
  id: string;
  email: string;
  roleName: string;
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: DecodedToken;
    resourceUserId?: string;
  }
}