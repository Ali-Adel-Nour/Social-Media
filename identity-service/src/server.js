require('dotenv').config();
const mongoose = require('mongoose');
const logger = require('../utils/logger');
const express = require('express');
const helmet = require('helmet');
const { configureCors } = require('../middleware/cors');
const {authLimiter } = require('../middleware/rateLimiter');
const routes = require('../routes/identityService');
const errorHandler = require("../middleware/errorHandler");
const PORT = process.env.PORT || 8000;
const connectDB = require('../config/db');

const app = express();

// Apply middleware in correct order
app.use(helmet());
app.use(express.json());
app.use(authLimiter);

// Use the CORS middleware correctly
app.use(configureCors())

// Routes
app.use('/api/v1/auth', routes);

// Error handler
app.use(errorHandler);

connectDB();



// Start the server
app.listen(PORT, () => {
  logger.info(`Identity server listening on port ${PORT}`);
});


process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at", promise, "reason:", reason);
});