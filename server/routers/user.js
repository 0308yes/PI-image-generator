import express from 'express';

import user from '../controller/user.js';

import auth from '../middleware/auth.js'
import adminAuth from '../middleware/adminAuth.js'

const router = express.Router();

router
    .get('/getAllUsers', auth, adminAuth, user.onGetAllUsers)
    .get('/getUserById', auth, user.onGetUserById)
    .post('/createUser', auth, adminAuth, user.onCreateUser)
    .post('/loginUser', user.onLoginUser)
    .delete('/deleteUser', auth, adminAuth, user.onDeleteUserById)
    .delete('/deleteAllUsers', auth, adminAuth, user.onDeleteAllUsers)

export default router;