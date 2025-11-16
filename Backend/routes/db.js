const express = require('express');
const router = express.Router();
const db = require('../controllers/dbController');

router.post('/resetdbTests', db.resetdb);

module.exports = router;