import type { Request, Response, NextFunction } from 'express';
import { z } from "zod";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const collectionSchema = z.object({
  name: z.string().max(16, 'Colection name is too long').min(1, 'Colection name is required'), 
  icon: z.string().min(1, 'Colection icon is required'),
})

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
