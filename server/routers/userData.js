import express from 'express';
import auth from '../middleware/auth.js'

import userData from '../controller/userData.js';

const router = express.Router();

router
    .get('/allLogs', auth, userData.onGetAllLogs)
    // .get('/log', userData.onCreateLogById)
    .post('/generate-image', auth, userData.onGenerateImage)
    // /.post('/generate-weekly-image', auth, userData.onGenerateWeeklyImage)
    .post('/save-memo', auth, userData.onSaveMemo)


export default router;