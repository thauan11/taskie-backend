import { Router } from 'express';
import { getUser } from '../controllers/userController';
import { getAllTasks, getUserTasks, createTask, updateTask, getSpecificTask, getCollection, createCollection } from '../controllers/taskController';
import { validateUserId, validateTaskSchema, validateTaskId, validateCollectionId, validateCollection } from '../middlewares/validateTask';

const router = Router();

router.get('/', getUser);

router.get('/tasks', getAllTasks);
router.get('/:userId/tasks', validateUserId, getUserTasks);
router.get('/:userId/tasks/:taskId', validateUserId, validateTaskId, getSpecificTask);

router.get('/:userId/collections', validateUserId, getCollection);
router.post('/:userId/collections', validateUserId, validateCollection, createCollection);

router.post('/:userId/collections/:collectionId/tasks', validateUserId, validateCollectionId, validateTaskSchema, createTask);
router.patch('/:userId/tasks/:taskId', validateTaskId, updateTask);

export default router;
