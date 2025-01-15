import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getCollection = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const collections = await prisma.collection.findMany({
      where: { userId },
    });

    if (collections.length <= 0) {
      res.status(204).json({ message: 'No collections found' });
    } else {
      res.status(200).json(collections);
    }
  } catch (error) {
    console.error('Error listing collections:', error);
    res.status(500).json({ error: 'Failed to list collections' });
  }
};

export const getCollectionSpecific = async (req: Request, res: Response) => {
  try {
    const { collectionId } = req.params;

    const collections = await prisma.collection.findMany({
      where: { id: Number(collectionId) },
    });

    if (collections.length <= 0) {
      res.status(204).json({ message: 'No collections found' });
    } else {
      res.status(200).json(collections);
    }
  } catch (error) {
    console.error('Error listing collections:', error);
    res.status(500).json({ error: 'Failed to list collections' });
  }
};

export const createCollection = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { 
      name,
      icon,
    } = req.body;

    const collection = await prisma.collection.create({
      data: {
        name,
        icon,
        userId,
      },
    });

    res.status(201).json({ message: "Collection created successfully", collection: collection });
  } catch (error) {
    console.error("Error creating a collection:", error);

    res
      .status(500)
      .json({ error: "An error occurred while creating a collection." });
  }
};

export const updateCollection = async (req: Request, res: Response) => {
  try {
    const { collectionId } = req.params;
    const bodyData = req.body;

    const updatedCollection = await prisma.collection.update({
      where: { id: Number(collectionId) },
      data: {
        ...bodyData,
      },
    });

    res.status(200).json({ message: 'Collection updated successfully', collection: updatedCollection });
  } catch (error) {
    console.error('Error updating collection:', error);
    res.status(500).json({ error: 'An error occurred while updating the collection' });
  }
};

export const deleteCollection = async (req: Request, res: Response) => {
  try {
    const { userId, collectionId } = req.params;

    const tasks = await prisma.task.findMany({
      where: { collectionId: Number(collectionId), userId },
    });
    
    for (const task of tasks) {
      await prisma.task.delete({ where: { id: task.id } });
    }

    const deleteCollection = await prisma.collection.delete({
      where: { id: Number(collectionId) }
    });

    res.status(200).json({ message: 'Collection deleted successfully', collection: deleteCollection });
  } catch (error) {
    console.error('Error deleted collection:', error);
    res.status(500).json({ error: 'An error occurred while deleted the collection' });
  }
};
