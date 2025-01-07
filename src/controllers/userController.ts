import type { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

interface Err {
	code: string;
	clientVersion: string;
	meta: Array<{ modelName: string, target: object }>;
}

export const getUser = async (req: Request, res: Response) => {
	try {
		const users = await prisma.user.findMany();
		res.json(users);
	} catch (error) {
		console.error("Error listing users:", error);
		res.status(500).json({ error: "Error listing users" });
	}
};

export const createUser = async (req: Request, res: Response) => {
	try {
		const { name, email, password } = req.body;

		const hashedPassword = await bcrypt.hash(password, 10);

		const user = await prisma.user.create({
			data: {
				name,
				email,
				password: hashedPassword,
				portrait: "",
			},
		});

		res.status(201).json({ message: "User created successfully", user });
	} catch (error) {
    const err = error as Err;
		if (err.code === 'P2002') {
      res.status(400).json({ error: 'Email already exists.' });
		  return
		}
		
    console.error("Error creating user:", error);

		res
			.status(500)
			.json({ error: "An error occurred while creating the user." });
	}
};

export const updateUser = async (req: Request, res: Response) => {
	try {
		const { userId } = req.params;
		const bodyData = req.body;

		const updatedUser = await prisma.user.update({
			where: { id: userId },
			data: {
				...bodyData,
			},
		});

		res.status(200).json({ message: 'User updated successfully', user: updatedUser });
	} catch (error) {
		console.error('Error updating user:', error);
		res.status(500).json({ error: 'An error occurred while updating the user' });
	}
};
