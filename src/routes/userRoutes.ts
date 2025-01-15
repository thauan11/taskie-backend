import { Router } from 'express';
import { getUser, updateUser } from '../controllers/userController';
import { getAllTasks, getUserTasks, createTask, updateTask, getSpecificTask, deleteTask } from '../controllers/taskController';
import { validateUserId, validateTaskSchema, validateTaskId, validateCollectionId, validateCollection } from '../middlewares/validateTask';
import { createCollection, deleteCollection, getCollection, getCollectionSpecific, updateCollection } from '../controllers/collectionController';
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
// router.delete('/:userId/collections/:collectionId', validateUserId, validateCollection, deleteCollection);
router.delete('/:userId/collections/:collectionId', deleteCollection);

router.post('/:userId/collections/:collectionId/tasks', validateUserId, validateCollectionId, validateTaskSchema,createTask);
router.patch('/:userId/tasks/:taskId', validateUserId, validateTaskId, updateTask);
router.delete('/:userId/collections/:collectionId/tasks/:taskId', validateUserId, validateTaskId, deleteTask);

export default router;
