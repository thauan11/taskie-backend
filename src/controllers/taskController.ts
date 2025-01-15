import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const updateTaskSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  endAt: z.string().optional(),
  completed: z.boolean().optional(),
  deleted: z.boolean().optional(),
});

export const getAllTasks = async (req: Request, res: Response) => {
  try { 
    const { userId, collectionId } = req.params;

    const tasks = await prisma.task.findMany({
      where: { collectionId: Number(collectionId), userId },
    });
    
    res.status(200).json(tasks);
  } catch (error) {
    console.error('Error listing tasks:', error);
    res.status(500).json({ error: 'Failed to list tasks' });
  }
};

export const getUserTasks = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const tasks = await prisma.task.findMany({
      where: { userId },
    });

    if (tasks.length <= 0) {
      res.status(204).json({ message: 'No tasks found' });
    } else {
      res.status(200).json(tasks);
    }
  } catch (error) {
    console.error('Error listing tasks:', error);
    res.status(500).json({ error: 'Failed to list tasks' });
  }
};

export const getSpecificTask = async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;

    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    res.status(200).json(task);
  } catch (error) {
    console.error('Error listing tasks:', error);
    res.status(500).json({ error: 'Failed to list tasks' });
  }
};

export const createTask = async (req: Request, res: Response) => {
  try {
    const { userId, collectionId } = req.params;
    const { 
      title,
      description,
      endAt,
      completed = false,
      deleted = false 
    } = req.body;

    const task = await prisma.task.create({
      data: {
        title,
        description,
        endAt,
        completed,
        deleted,
        collectionId: Number(collectionId),
        userId,
      },
    });

    res.status(201).json({ message: "Task created successfully", task: task });
  } catch (error) {
    console.error("Error creating a task:", error);

    res
      .status(500)
      .json({ error: "An error occurred while creating a task." });
  }
};

export const updateTask = async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;

    const parsedData = updateTaskSchema.parse(req.body);

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...parsedData,
        ...(parsedData.endAt && { endAt: parsedData.endAt ? new Date(parsedData.endAt) : "" }),
      },
    });

    res.status(200).json({ message: 'Task updated successfully', task: updatedTask });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'An error occurred while updating the task.' });
  }
};

export const deleteTask = async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;

    const deleteTask = await prisma.task.delete({
      where: { id: taskId },
    });

    res.status(200).json({ message: 'Task deleted successfully', task: deleteTask });
  } catch (error) {
    console.error('Error deleted task:', error);
    res.status(500).json({ error: 'An error occurred while deleted the task.' });
  }
};
