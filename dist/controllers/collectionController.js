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
exports.deleteCollection = exports.updateCollection = exports.createCollection = exports.getCollectionSpecific = exports.getCollection = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const getCollection = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.params;
        const collections = yield prisma.collection.findMany({
            where: { userId },
        });
        if (collections.length <= 0) {
            res.status(204).json({ message: 'No collections found' });
        }
        else {
            res.status(200).json(collections);
        }
    }
    catch (error) {
        console.error('Error listing collections:', error);
        res.status(500).json({ error: 'Failed to list collections' });
    }
});
exports.getCollection = getCollection;
const getCollectionSpecific = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { collectionId } = req.params;
        const collections = yield prisma.collection.findMany({
            where: { id: Number(collectionId) },
        });
        if (collections.length <= 0) {
            res.status(204).json({ message: 'No collections found' });
        }
        else {
            res.status(200).json(collections);
        }
    }
    catch (error) {
        console.error('Error listing collections:', error);
        res.status(500).json({ error: 'Failed to list collections' });
    }
});
exports.getCollectionSpecific = getCollectionSpecific;
const createCollection = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.params;
        const { name, icon, } = req.body;
        const collection = yield prisma.collection.create({
            data: {
                name,
                icon,
                userId,
            },
        });
        res.status(201).json({ message: "Collection created successfully", collection: collection });
    }
    catch (error) {
        console.error("Error creating a collection:", error);
        res
            .status(500)
            .json({ error: "An error occurred while creating a collection." });
    }
});
exports.createCollection = createCollection;
const updateCollection = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { collectionId } = req.params;
        const bodyData = req.body;
        const updatedCollection = yield prisma.collection.update({
            where: { id: Number(collectionId) },
            data: Object.assign({}, bodyData),
        });
        res.status(200).json({ message: 'Collection updated successfully', collection: updatedCollection });
    }
    catch (error) {
        console.error('Error updating collection:', error);
        res.status(500).json({ error: 'An error occurred while updating the collection' });
    }
});
exports.updateCollection = updateCollection;
const deleteCollection = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId, collectionId } = req.params;
        const tasks = yield prisma.task.findMany({
            where: { collectionId: Number(collectionId), userId },
        });
        for (const task of tasks) {
            yield prisma.task.delete({ where: { id: task.id } });
        }
        const deleteCollection = yield prisma.collection.delete({
            where: { id: Number(collectionId) }
        });
        res.status(200).json({ message: 'Collection deleted successfully', collection: deleteCollection });
    }
    catch (error) {
        console.error('Error deleted collection:', error);
        res.status(500).json({ error: 'An error occurred while deleted the collection' });
    }
});
exports.deleteCollection = deleteCollection;
