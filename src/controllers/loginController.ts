import type { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

interface JWTPayload {
  id: string;
  email: string;
  name: string;
  portrait: string;
}

export const loginUser = async (req: Request, res: Response) => {
  const { email, password, rememberMe } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });

	if (!user) {
		res.status(404).json({ error: 'User not found' });
		return
	}

	const isPasswordValid = await bcrypt.compare(password, user.password);
	if (!isPasswordValid) {
    res.status(401).json({ error: 'Invalid credentials' });
		return
	}
	
  const expiresIn = rememberMe ? '30d' : '1d';
  const token = jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    process.env.JWT_SECRET as string,
    { expiresIn }
  );

  res.cookie('authToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENVIRONMENT === 'prod',
    sameSite: "strict",
    maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000,
  });

  res.status(200).json({ message: 'Login successful' });
};

export const tokenValidation = (req: Request, res: Response) => {
  const token = req.cookies.authToken;

  if (!token) {
    res.status(401).json({ message: "Token not provided" });
    return
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JWTPayload;
    const { id, email, name } = decoded;
    res.status(200).json({ user: { id, email, name } });
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};