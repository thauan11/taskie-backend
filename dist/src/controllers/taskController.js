"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTask = exports.updateTask = exports.createTask = exports.getSpecificTask = exports.getUserTasks = exports.getAllTasks = void 0;
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const prisma = new client_1.PrismaClient();
const updateTaskSchema = zod_1.z.object({
    title: zod_1.z.string().optional(),
    description: zod_1.z.string().optional(),
    endAt: zod_1.z.string().optional(),
    completed: zod_1.z.boolean().optional(),
    deleted: zod_1.z.boolean().optional(),
});
const getAllTasks = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId, collectionId } = req.params;
        const tasks = yield prisma.task.findMany({
            where: { collectionId: Number(collectionId), userId },
        });
        res.status(200).json(tasks);
    }
    catch (error) {
        console.error('Error listing tasks:', error);
        res.status(500).json({ error: 'Failed to list tasks' });
    }
});
exports.getAllTasks = getAllTasks;
const getUserTasks = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.params;
        const tasks = yield prisma.task.findMany({
            where: { userId },
        });
        if (tasks.length <= 0) {
            res.status(204).json({ message: 'No tasks found' });
        }
        else {
            res.status(200).json(tasks);
        }
    }
    catch (error) {
        console.error('Error listing tasks:', error);
        res.status(500).json({ error: 'Failed to list tasks' });
    }
});
exports.getUserTasks = getUserTasks;
const getSpecificTask = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { taskId } = req.params;
        const task = yield prisma.task.findUnique({
            where: { id: taskId },
        });
        res.status(200).json(task);
    }
    catch (error) {
        console.error('Error listing tasks:', error);
        res.status(500).json({ error: 'Failed to list tasks' });
    }
});
exports.getSpecificTask = getSpecificTask;
const createTask = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId, collectionId } = req.params;
        const { title, description, endAt, completed = false, deleted = false } = req.body;
        const task = yield prisma.task.create({
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
    }
    catch (error) {
        console.error("Error creating a task:", error);
        res
            .status(500)
            .json({ error: "An error occurred while creating a task." });
    }
});
exports.createTask = createTask;
const updateTask = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { taskId } = req.params;
        const parsedData = updateTaskSchema.parse(req.body);
        const updatedTask = yield prisma.task.update({
            where: { id: taskId },
            data: Object.assign(Object.assign({}, parsedData), (parsedData.endAt === "" ? { endAt: null } : parsedData.endAt && { endAt: new Date(parsedData.endAt) })),
        });
        res.status(200).json({ message: 'Task updated successfully', task: updatedTask });
    }
    catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({ error: 'An error occurred while updating the task.' });
    }
});
exports.updateTask = updateTask;
const deleteTask = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { taskId } = req.params;
        const deleteTask = yield prisma.task.delete({
            where: { id: taskId },
        });
        res.status(200).json({ message: 'Task deleted successfully', task: deleteTask });
    }
    catch (error) {
        console.error('Error deleted task:', error);
        res.status(500).json({ error: 'An error occurred while deleted the task.' });
    }
});
exports.deleteTask = deleteTask;
