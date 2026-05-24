import dotenv from 'dotenv';
import path from 'path';

// Load .env.test and override any existing process.env variables
dotenv.config({
  path: path.resolve(__dirname, '../.env.test'),
  override: true,
});
