// backend/src/config/logging.js
const winston = require('winston');

const setupLogging = () => {
  winston.configure({
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
      }),
      new winston.transports.File({ filename: 'error.log', level: 'error' })
    ]
  });
};

module.exports = { setupLogging };