import express from 'express';
import multer from 'multer';

import {
    createProblem,
    getProblems,
    getProblemById,
    updateProblemStatus,
    deleteProblem
} from '../controllers/problemController';

import { authenticateToken } from '../middleware/authMiddleware';

const router = express.Router();


// Configuração da foto
const storage = multer.diskStorage({

    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },

    filename: (req, file, cb) => {
        cb(
            null,
            Date.now() + '-' + file.originalname
        );
    }

});

const upload = multer({ storage });


// POST /issues
router.post(
    '/',
    authenticateToken,
    upload.single('photo'),
    createProblem
);


// GET /issues
router.get(
    '/',
    getProblems
);


// GET /issues/:id
router.get(
    '/:id',
    getProblemById
);


// PATCH /issues/:id/status
router.patch(
    '/:id/status',
    authenticateToken,
    updateProblemStatus
);


// DELETE /issues/:id
router.delete(
    '/:id',
    authenticateToken,
    deleteProblem
);


export default router;