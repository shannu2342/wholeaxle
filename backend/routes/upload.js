const express = require('express');
const multer = require('multer');
const { asyncHandler } = require('../middleware/errorHandler');
const { authMiddleware } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Configure multer for memory storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        // Allow images, documents, and voice files
        const allowedMimes = [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
            'application/pdf',
            'text/plain',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'audio/mpeg',
            'audio/wav',
            'audio/mp4'
        ];

        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type'), false);
        }
    }
});

// @route   POST /api/upload/image
// @desc    Upload image file
// @access  Private
router.post('/image', authMiddleware, upload.single('image'), asyncHandler(async (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            error: 'No image file provided',
            code: 'NO_FILE'
        });
    }

    // Mock upload response - in real implementation, you would upload to cloud storage
    const uploadResult = {
        url: `https://wholexale.com/uploads/images/${Date.now()}-${req.file.originalname}`,
        filename: req.file.originalname,
        size: req.file.size,
        mimeType: req.file.mimetype
    };

    logger.info(`Image uploaded by user ${req.userId}: ${uploadResult.url}`);

    res.json({
        message: 'Image uploaded successfully',
        upload: uploadResult
    });
}));

// @route   POST /api/upload/document
// @desc    Upload document file
// @access  Private
router.post('/document', authMiddleware, upload.single('document'), asyncHandler(async (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            error: 'No document file provided',
            code: 'NO_FILE'
        });
    }

    // Mock upload response
    const uploadResult = {
        url: `https://wholexale.com/uploads/documents/${Date.now()}-${req.file.originalname}`,
        filename: req.file.originalname,
        size: req.file.size,
        mimeType: req.file.mimetype
    };

    logger.info(`Document uploaded by user ${req.userId}: ${uploadResult.url}`);

    res.json({
        message: 'Document uploaded successfully',
        upload: uploadResult
    });
}));

// @route   POST /api/upload/voice
// @desc    Upload voice message
// @access  Private
router.post('/voice', authMiddleware, upload.single('voice'), asyncHandler(async (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            error: 'No voice file provided',
            code: 'NO_FILE'
        });
    }

    // Mock upload response
    const uploadResult = {
        url: `https://wholexale.com/uploads/voice/${Date.now()}-${req.file.originalname}`,
        filename: req.file.originalname,
        size: req.file.size,
        mimeType: req.file.mimetype,
        duration: 30 // Mock duration
    };

    logger.info(`Voice message uploaded by user ${req.userId}: ${uploadResult.url}`);

    res.json({
        message: 'Voice message uploaded successfully',
        upload: uploadResult
    });
}));

module.exports = router;