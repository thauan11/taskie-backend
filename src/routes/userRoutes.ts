import { Router } from 'express';
import { getUser, updateUser } from '../controllers/userController';
import { getAllTasks, getUserTasks, createTask, updateTask, getSpecificTask } from '../controllers/taskController';
import { validateUserId, validateTaskSchema, validateTaskId, validateCollectionId, validateCollection } from '../middlewares/validateTask';
import { createCollection, getCollection, getCollectionSpecific, updateCollection } from '../controllers/collectionController';
import { validateUser } from '../middlewares/validateUser';

const router = Router();

router.get('/', getUser);
router.patch('/:userId', validateUser, updateUser);

router.get('/:userId/collections/:collectionId/tasks', validateUserId, validateCollectionId, getAllTasks);
router.get('/:userId/tasks', validateUserId, getUserTasks);
router.get('/:userId/tasks/:taskId', validateUserId, validateTaskId, getSpecificTask);

router.get('/:userId/collections', validateUserId, getCollection);
router.get('/:userId/collection/:collectionId', validateUserId, getCollectionSpecific);
router.post('/:userId/collections', validateUserId, validateCollection, createCollection);
router.patch('/:userId/collections/:collectionId', validateUserId, validateCollection, updateCollection);

router.post('/:userId/collections/:collectionId/tasks', validateUserId, validateCollectionId, validateTaskSchema,createTask);
router.patch('/:userId/tasks/:taskId', validateUserId, validateTaskId, updateTask);

export default router;
