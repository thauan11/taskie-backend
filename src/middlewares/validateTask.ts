import type { Request, Response, NextFunction } from 'express';
import { z } from "zod";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  description: z.string().min(1, 'Description is required.'),
  collectionId: z.number().min(1, 'Collection is required.'),
  // endAt: z.string().min(1, 'End date is required.'),
  endAt: z.string().optional(),
  completed: z.boolean().optional(),
  deleted: z.boolean().optional(),
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
      res.status(400).json({ error: error.issues });
      return
    }

    next(error);
  }
}

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
      res.status(400).json({ error: error.issues });
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
      res.status(400).json({ error: error.issues });
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
      res.status(400).json({ error: error.issues });
      return
    }

    next(error);
  }
};
