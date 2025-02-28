const logger = require('../utils/logger');
const { validateRegistration } = require('../utils/validation');
const generateToken = require('../utils/generateToken');
const User = require('../models/User');

const registerUser = async (req, res) => {
  try {
    // Log registration attempt
    logger.info('User registration attempt', {
      email: req.body.email,
      requestId: req.requestId
    });

    // Validate input
    const { error } = validateRegistration(req.body);
    if (error) {
      logger.warn('Validation error during registration', {
        error: error.details[0].message,
      });
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { email, password, username } = req.body;

    // Check existing user
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      logger.warn('User already exists', { email });
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }

    // Create and save user first
    const user = await User.create({
      email,
      password,
      username
    });

    // Generate tokens after user is saved
    const { accessToken, refreshToken } = await generateToken(user);

    logger.info('User registered successfully', {
      userId: user._id,
      email: user.email
    });

    // Return success response
    return res.status(201).json({
      success: true,
      data: {
        user: {
          _id: user._id,
          email: user.email,
          username: user.username
        },
        accessToken,
        refreshToken
      }
    });

  } catch (error) {
    logger.error('User registration failed', {
      error: error.message,
      stack: error.stack,
      body: req.body
    });

    return res.status(400).json({
      success: false,
      message: 'Registration failed'
    });
  }
};

module.exports = { registerUser };