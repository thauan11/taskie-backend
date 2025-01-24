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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserPortrait = exports.updateUser = exports.createUser = exports.getUserSpecific = exports.getUser = void 0;
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma = new client_1.PrismaClient();
const getUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const users = yield prisma.user.findMany();
        res.json(users);
    }
    catch (error) {
        console.error("Error listing users:", error);
        res.status(500).json({ error: "Error listing users" });
    }
});
exports.getUser = getUser;
const getUserSpecific = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.params;
        const user = yield prisma.user.findMany({
            where: { id: userId },
        });
        if (user.length <= 0) {
            res.status(204).json({ message: 'No user found' });
        }
        else {
            res.status(200).json(user);
        }
    }
    catch (error) {
        console.error('Error listing user data:', error);
        res.status(500).json({ error: 'Failed to list user data' });
    }
});
exports.getUserSpecific = getUserSpecific;
const createUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, email, password } = req.body;
        const hashedPassword = yield bcrypt_1.default.hash(password, 10);
        const user = yield prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                portrait: "",
                roleName: "user",
            },
        });
        res.status(201).json({ message: "User created successfully", user });
    }
    catch (error) {
        const err = error;
        if (err.code === 'P2002') {
            res.status(400).json({ error: 'Email already exists.' });
            return;
        }
        console.error("Error creating user:", error);
        res
            .status(500)
            .json({ error: "An error occurred while creating the user." });
    }
});
exports.createUser = createUser;
const updateUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.params;
        const bodyData = req.body;
        const updatedUser = yield prisma.user.update({
            where: { id: userId },
            data: Object.assign({}, bodyData),
        });
        res.status(200).json({ message: 'User updated successfully', user: updatedUser });
    }
    catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'An error occurred while updating the user' });
    }
});
exports.updateUser = updateUser;
const updateUserPortrait = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.params;
        const { portrait } = req.body;
        const updatedUser = yield prisma.user.update({
            where: { id: userId },
            data: {
                portrait,
            },
        });
        res.status(200).json({ message: 'User portrait updated successfully', user: updatedUser });
    }
    catch (error) {
        console.error('Error updating user portrait:', error);
        res.status(500).json({ error: 'An error occurred while updating the user portrait' });
    }
});
exports.updateUserPortrait = updateUserPortrait;
