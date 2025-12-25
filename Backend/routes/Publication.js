const express = require('express');
const router = express.Router();
const PublicationController = require('../controllers/PublicationController');
const { checkUser } = require('../controllers/Middleware.js');
const multer = require('multer');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if(req.originalUrl.includes('addComment')) {
      cb(null, "uploads/comments/"); // dossier où sauvegarder les images des commentaires
    } else {
    cb(null, "uploads/");
    } // dossier où sauvegarder
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limite de taille de fichier à 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/heic'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Type de fichier non autorisé'));
    }
  }
});

router.post('/addPost', upload.single('image'), PublicationController.createPublication);
router.get('/getAllPosts', PublicationController.getAllPublications);
router.post('/likePost/:id', checkUser, PublicationController.likePublication);
router.post('/addComment/:id', upload.single('image'),checkUser, PublicationController.addCommentToPublication);
router.get('/getAllPostUserConnected', checkUser, PublicationController.getAllPublicationsUserConnecter);
router.post('/likeComment/:id', checkUser, PublicationController.likeComment);
router.delete('/deleteComment/:id', checkUser, PublicationController.deleteComment);
router.get('/getUsersWhoLikedPost/:id', checkUser, PublicationController.getUsersWhoLikedPost);
router.get('/getUsersWhoCommentedPost/:id', checkUser, PublicationController.getUsersWhoCommentedPost);
router.get('/getUsersWhoSharedPost/:id', checkUser, PublicationController.getUsersWhoSharedPost);
router.post('/sharePublication/:id', checkUser, PublicationController.sharePublication);

module.exports = router;