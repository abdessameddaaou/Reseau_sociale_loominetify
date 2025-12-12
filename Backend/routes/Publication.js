const express = require('express');
const router = express.Router();
const PublicationController = require('../controllers/PublicationController');
const { checkUser } = require('../controllers/Middleware.js');
const multer = require('multer');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // dossier où sauvegarder
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage: storage });
router.post('/addPost', upload.single('image'), PublicationController.createPublication);
router.get('/getAllPosts', PublicationController.getAllPublications);

module.exports = router;