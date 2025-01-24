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
exports.validateTaskSchema = exports.validateTaskId = exports.validateCollectionId = exports.validateCollection = exports.validateUserId = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const taskSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, 'Title is required'),
    description: zod_1.z.string().min(1, 'Description is required'),
    endAt: zod_1.z.string().optional(),
    completed: zod_1.z.boolean().optional(),
    deleted: zod_1.z.boolean().optional(),
});
const collectionSchema = zod_1.z.object({
    name: zod_1.z.string().max(16, 'Colection name is too long').min(1, 'Colection name is required'),
    icon: zod_1.z.string().min(1, 'Colection icon is required'),
});
const validateUserId = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.params;
        const userInDatabase = yield prisma.user.findUnique({
            where: { id: userId },
        });
        if (!userInDatabase) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        next();
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            const errorMessages = error.issues.map(issue => issue.message);
            res.status(400).json({ error: errorMessages[0] });
            return;
        }
        next(error);
    }
});
exports.validateUserId = validateUserId;
const validateCollection = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        collectionSchema.parse(req.body);
        next();
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            const errorMessages = error.issues.map(issue => issue.message);
            res.status(400).json({ error: errorMessages[0] });
            return;
        }
        next(error);
    }
});
exports.validateCollection = validateCollection;
const validateCollectionId = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { collectionId } = req.params;
        const collectionInDb = yield prisma.collection.findUnique({
            where: { id: Number(collectionId) },
        });
        if (!collectionInDb) {
            res.status(404).json({ error: 'Collection not found' });
            return;
        }
        next();
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            const errorMessages = error.issues.map(issue => issue.message);
            res.status(400).json({ error: errorMessages[0] });
            return;
        }
        next(error);
    }
});
exports.validateCollectionId = validateCollectionId;
const validateTaskId = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { taskId } = req.params;
        const taskInDatabase = yield prisma.task.findUnique({
            where: { id: taskId },
        });
        if (!taskInDatabase) {
            res.status(404).json({ error: 'Task not found' });
            return;
        }
        next();
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            const errorMessages = error.issues.map(issue => issue.message);
            res.status(400).json({ error: errorMessages[0] });
            return;
        }
        next(error);
    }
});
exports.validateTaskId = validateTaskId;
const validateTaskSchema = (req, res, next) => {
    try {
        taskSchema.parse(req.body);
        next();
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            const errorMessages = error.issues.map(issue => issue.message);
            res.status(400).json({ error: errorMessages[0] });
            return;
        }
        next(error);
    }
};
exports.validateTaskSchema = validateTaskSchema;
