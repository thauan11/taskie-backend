import { Router } from 'express';
import { getUser, getUserSpecific, updateUser, updateUserPortrait } from '../controllers/userController';
import { getAllTasks, getUserTasks, createTask, updateTask, getSpecificTask, deleteTask } from '../controllers/taskController';
import { validateUserId, validateTaskSchema, validateTaskId, validateCollectionId, validateCollection } from '../middlewares/validateTask';
import { createCollection, deleteCollection, getCollection, getCollectionSpecific, updateCollection } from '../controllers/collectionController';
import { validateUser } from '../middlewares/validateUser';
import { authorizeRole } from '../middlewares/authorizeRole';
import { extractResourceUserId } from '../middlewares/extractResourceUserId';

const router = Router();
router.use(extractResourceUserId);

router.get('/', authorizeRole(['admin']), getUser);
router.get('/:userId', authorizeRole(['admin', 'user']), getUserSpecific);
router.patch('/:userId', authorizeRole(['admin', 'user']), updateUser);
router.patch('/:userId/portrait', authorizeRole(['admin', 'user']), updateUserPortrait);

router.get('/:userId/collections/:collectionId/tasks', authorizeRole(['admin', 'user']), validateCollectionId, getAllTasks);
router.get('/:userId/tasks', authorizeRole(['admin', 'user']), getUserTasks);
router.get('/:userId/tasks/:taskId', authorizeRole(['admin', 'user']), validateTaskId, getSpecificTask);

router.get('/:userId/collections', authorizeRole(['admin', 'user']), getCollection);
router.get('/:userId/collection/:collectionId', authorizeRole(['admin', 'user']), getCollectionSpecific);
router.post('/:userId/collections', authorizeRole(['admin', 'user']), validateCollection, createCollection);
router.patch('/:userId/collections/:collectionId', authorizeRole(['admin', 'user']), validateCollection, updateCollection);
router.delete('/:userId/collections/:collectionId', authorizeRole(['admin', 'user']), deleteCollection);

router.post('/:userId/collections/:collectionId/tasks', authorizeRole(['admin', 'user']), validateCollectionId, validateTaskSchema,createTask);
router.patch('/:userId/tasks/:taskId', authorizeRole(['admin', 'user']), validateTaskId, updateTask);
router.delete('/:userId/collections/:collectionId/tasks/:taskId', authorizeRole(['admin', 'user']), validateTaskId, deleteTask);

export default router;
