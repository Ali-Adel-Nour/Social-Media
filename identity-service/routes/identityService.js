const express = require('express');
const { registerUser } = require('../controllers/identityController');
const { authLimiter } = require('../middleware/rateLimiter');
const router = express.Router();


router.post('/register', authLimiter, registerUser);

module.exports = router;