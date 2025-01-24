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
exports.validateCollectionId = exports.validateCollection = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const collectionSchema = zod_1.z.object({
    name: zod_1.z.string().max(16, 'Collection name is too long').min(1, 'Collection name is required'),
    icon: zod_1.z.string().min(1, 'Collection icon is required'),
});
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
