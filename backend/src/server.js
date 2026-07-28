import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketIO } from 'socket.io';
import jwt from 'jsonwebtoken';
import config from './config/env.js';
import logger from './utils/logger.js';
import routes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';
import chatService from './services/chat.service.js';

const app = express();
const httpServer = createServer(app);

const io = new SocketIO(httpServer, {
  cors: {
    origin: config.nodeEnv === 'production' ? false : ['http://localhost:5173', 'http://localhost:3000'],
    methods: ['GET', 'POST'],
  },
});

app.set('io', io);

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) {
    return next(new Error('Authentication required'));
  }
  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    socket.userId = decoded.id;
    socket.organizationId = decoded.organizationId;
    next();
  } catch {
    next(new Error('Invalid token'));
  }
});

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api', routes);

app.use(notFoundHandler);
app.use(errorHandler);

io.on('connection', (socket) => {
  logger.debug(`Socket connected: ${socket.id} user:${socket.userId}`);

  socket.on('join:user', () => {
    socket.join(`user:${socket.userId}`);
  });

  socket.on('chat:join', (conversationId) => {
    socket.join(`chat:${conversationId}`);
  });

  socket.on('chat:leave', (conversationId) => {
    socket.leave(`chat:${conversationId}`);
  });

  socket.on('chat:send', async (data) => {
    try {
      if (!data.conversationId || !data.text) {
        socket.emit('chat:error', { message: 'Conversation ID and text are required' });
        return;
      }
      if (data.text.length > 5000) {
        socket.emit('chat:error', { message: 'Message too long (max 5000 characters)' });
        return;
      }

      const result = await chatService.sendMessage(data.conversationId, socket.userId, data.text);

      io.to(`chat:${data.conversationId}`).emit('chat:message:new', {
        message: result.message,
        conversation: result.conversation,
      });

      const unreadPayload = {
        conversationId: data.conversationId,
        conversation: result.conversation,
      };

      io.to(`user:${socket.userId}`).emit('chat:unread:update', unreadPayload);

      if (result.otherUserId) {
        io.to(`user:${result.otherUserId}`).emit('chat:unread:update', unreadPayload);
      }
    } catch (err) {
      logger.error(`chat:send error: ${err.message}`);
      socket.emit('chat:error', { message: err.message || 'Failed to send message' });
    }
  });

  socket.on('chat:typing', (data) => {
    socket.to(`chat:${data.conversationId}`).emit('chat:typing', {
      conversationId: data.conversationId,
      userId: socket.userId,
    });
  });

  socket.on('chat:typing:stop', (data) => {
    socket.to(`chat:${data.conversationId}`).emit('chat:typing:stop', {
      conversationId: data.conversationId,
      userId: socket.userId,
    });
  });

  socket.on('disconnect', () => {
    logger.debug(`Socket disconnected: ${socket.id}`);
  });
});

const startServer = async () => {
  const { default: connectDB } = await import('./config/db.js');
  await connectDB();

  const { default: registerEventListeners } = await import('./events/registerListeners.js');
  registerEventListeners();

  await import('./jobs/workers/index.js');

  const { default: notificationWorkerModule } = await import('./jobs/workers/notification.worker.js');
  if (notificationWorkerModule.setSocketIO) {
    notificationWorkerModule.setSocketIO(io);
    logger.info('Socket.IO attached to notification worker');
  }

  const { default: scheduleRenewalScan } = await import('./jobs/schedulers/renewalReminder.scheduler.js');
  await scheduleRenewalScan();

  httpServer.listen(config.port, () => {
    logger.info(`Server running on port ${config.port} in ${config.nodeEnv} mode`);
  });

  const shutdown = () => {
    logger.info('Shutting down gracefully...');
    io.close();
    httpServer.close(() => {
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 5000);
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
};

startServer();

export { app, httpServer, io };
