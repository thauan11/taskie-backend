import type { Request, Response, NextFunction } from 'express';
import { z } from "zod";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  collectionId: z.number().min(1, 'Collection is required'),
  endAt: z.string().optional(),
  completed: z.boolean().optional(),
  deleted: z.boolean().optional(),
})

const collectionSchema = z.object({
  name: z.string().max(16, 'Colection name is too long').min(1, 'Colection name is required'), 
  icon: z.string().min(1, 'Colection icon is required'),
})

export const validateUserId = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params;

    const userInDatabase = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!userInDatabase) {
      res.status(404).json({ error: 'User not found' });
      return
    }

    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues.map(issue => issue.message);
      res.status(400).json({ error: errorMessages[0] });
      return
    }

    next(error);
  }
}

export const validateCollection = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    collectionSchema.parse(req.body);
    
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues.map(issue => issue.message);
      res.status(400).json({ error: errorMessages[0] });
      return
    }

    next(error);
  }
};

export const validateCollectionId = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { collectionId } = req.params;

    const collectionInDb = await prisma.collection.findUnique({
      where: { id: Number(collectionId) },
    });

    if (!collectionInDb) {
      res.status(404).json({ error: 'Collection not found' });
      return
    }

    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues.map(issue => issue.message);
      res.status(400).json({ error: errorMessages[0] });
      return
    }

    next(error);
  }
}

export const validateTaskId = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { taskId } = req.params;

    const taskInDatabase = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!taskInDatabase) {
      res.status(404).json({ error: 'Task not found' });
      return
    }

    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues.map(issue => issue.message);
      res.status(400).json({ error: errorMessages[0] });
      return
    }

    next(error);
  }
}

export const validateTaskSchema = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    taskSchema.parse(req.body);
    
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues.map(issue => issue.message);
      res.status(400).json({ error: errorMessages[0] });
      return
    }

    next(error);
  }
};
