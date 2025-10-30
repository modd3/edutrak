import app from './app';
import dotenv from 'dotenv';
import logger from './utils/logger';

dotenv.config();

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  logger.info(`🚀 EduTrak School Management API running on port ${PORT}`, {
    environment: process.env.NODE_ENV || 'development',
    port: PORT
  });
  logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
  logger.info(`📚 Database: ${process.env.DATABASE_URL ? 'Connected' : 'Not configured'}`);
});
