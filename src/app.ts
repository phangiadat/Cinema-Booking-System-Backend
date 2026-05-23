import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import router from './routes';
import { errorMiddleware } from './middlewares/error.middleware';
import { notFoundMiddleware } from './middlewares/not-found.middleware';

const app = express();

// ========================
// Security Middlewares
// ========================
app.use(helmet());

app.use(
  cors({
    origin: env.isDevelopment() ? '*' : process.env.ALLOWED_ORIGINS?.split(','),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  }),
);

// ========================
// Parsing Middlewares
// ========================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ========================
// Logging Middleware
// ========================
if (env.isDevelopment()) {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ========================
// API Routes
// ========================
app.use(env.API_PREFIX, router);

// ========================
// 404 Handler (must be after routes)
// ========================
app.use(notFoundMiddleware);

// ========================
// Global Error Handler (must be last)
// ========================
app.use(errorMiddleware);

export default app;
