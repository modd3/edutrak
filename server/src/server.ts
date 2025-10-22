import app from './app';
import dotenv from 'dotenv';
import log from './logger';

dotenv.config();

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  log.info(`✅ Server running on http://localhost:${PORT}`);
});
