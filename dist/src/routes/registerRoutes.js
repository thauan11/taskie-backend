"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController_1 = require("../controllers/userController");
const validateUser_1 = require("../middlewares/validateUser");
const router = (0, express_1.Router)();
router.post('/', validateUser_1.validateUser, userController_1.createUser);
exports.default = router;
