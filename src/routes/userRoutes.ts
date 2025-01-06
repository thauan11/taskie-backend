import { Router } from 'express';
import { getUser } from '../controllers/userController';
import { getAllTasks, getUserTasks, createTask, updateTask, getSpecificTask, getCollection, createCollection } from '../controllers/taskController';
// import { getCollections } from '../controllers/taskController';
import { validateUserId, validateTaskSchema, validateTaskId, validateCollectionId } from '../middlewares/validateTask';

const router = Router();

router.get('/', getUser);

router.get('/tasks', getAllTasks);
router.get('/:userId/tasks', validateUserId, getUserTasks);
router.get('/:userId/tasks/:taskId', validateUserId, validateTaskId, getSpecificTask);

router.get('/:userId/collections', validateUserId, getCollection);
router.post('/:userId/collections', validateUserId, createCollection);

router.post('/:userId/collections/:collectionId/tasks', validateUserId, validateCollectionId, validateTaskSchema, createTask);
router.patch('/:userId/tasks/:taskId', validateTaskId, updateTask);

// router.get('/:userId/tasks/collections', validateUserId, getCollections);

export default router;
