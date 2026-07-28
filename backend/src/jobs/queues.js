import { Queue } from 'bullmq';
import redis from '../config/redis.js';

const pdfGenerationQueue = new Queue('pdf-generation', { connection: redis });
const notificationsQueue = new Queue('notifications', { connection: redis });
const renewalScanQueue = new Queue('renewal-scan', { connection: redis });

export { pdfGenerationQueue, notificationsQueue, renewalScanQueue };
