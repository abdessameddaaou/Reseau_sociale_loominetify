const express = require('express');
const router = express.Router();
const { checkUser } = require('../controllers/Middleware');
const ConversationController = require('../controllers/ConversationController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const sharp = require('sharp');

// Set ffmpeg binary path
ffmpeg.setFfmpegPath(ffmpegPath);

// Multer config for message media uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/messages/");
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
});

// Middleware: convert audio files (webm, ogg, wav, mp4) to MP3
const convertAudioToMp3 = (req, res, next) => {
    if (!req.file) return next();
    if (!req.file.mimetype.startsWith('audio/')) return next();
    if (req.file.mimetype === 'audio/mpeg' || req.file.mimetype === 'audio/mp3') return next();

    const inputPath = req.file.path;
    const outputFilename = req.file.filename.replace(/\.[^.]+$/, '') + '.mp3';
    const outputPath = path.join(req.file.destination, outputFilename);

    ffmpeg(inputPath)
        .toFormat('mp3')
        .audioBitrate('128k')
        .on('end', () => {
            // Remove original file
            fs.unlink(inputPath, () => { });
            // Update req.file to point to MP3
            req.file.filename = outputFilename;
            req.file.path = outputPath;
            req.file.mimetype = 'audio/mpeg';
            req.file.originalname = req.file.originalname.replace(/\.[^.]+$/, '.mp3');
            next();
        })
        .on('error', (err) => {
            console.error('Audio conversion error:', err.message);
            // If conversion fails, keep the original file
            next();
        })
        .save(outputPath);
};

// Middleware: convert HEIC/HEIF images to JPEG
const convertHeicToJpeg = async (req, res, next) => {
    if (!req.file) return next();

    const isHeic = req.file.mimetype === 'image/heic' ||
        req.file.mimetype === 'image/heif' ||
        /\.(heic|heif)$/i.test(req.file.originalname);

    if (!isHeic) return next();

    try {
        const inputPath = req.file.path;
        const outputFilename = req.file.filename.replace(/\.[^.]+$/, '') + '.jpg';
        const outputPath = path.join(req.file.destination, outputFilename);

        await sharp(inputPath)
            .jpeg({ quality: 90 })
            .toFile(outputPath);

        // Remove original HEIC file
        fs.unlink(inputPath, () => { });

        // Update req.file
        req.file.filename = outputFilename;
        req.file.path = outputPath;
        req.file.mimetype = 'image/jpeg';
        req.file.originalname = req.file.originalname.replace(/\.[^.]+$/i, '.jpg');
        next();
    } catch (err) {
        console.error('HEIC conversion error:', err.message);
        // If conversion fails, keep the original file
        next();
    }
};

// All routes require auth
router.use(checkUser);

// Conversations
router.get('/', ConversationController.getConversations);
router.post('/private', ConversationController.startPrivateConversation);
router.post('/group', ConversationController.createGroup);

// Messages within a conversation
router.get('/:id/messages', ConversationController.getMessages);
router.post('/:id/messages', upload.single('file'), convertAudioToMp3, convertHeicToJpeg, ConversationController.sendMessage);

// Group members
router.get('/:id/members', ConversationController.getGroupMembers);
router.post('/:id/members', ConversationController.addGroupMember);
router.delete('/:id/members/:userId', ConversationController.removeGroupMember);
router.post('/:id/leave', ConversationController.leaveGroup);

// Group avatar
router.put('/:id/avatar', upload.single('file'), ConversationController.updateGroupAvatar);
router.delete('/:id/avatar', ConversationController.removeGroupAvatar);

module.exports = router;

