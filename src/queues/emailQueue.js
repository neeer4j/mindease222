// frontend/src/queues/emailQueue.js

const Queue = require('bull');
const sendEmail = require('../utils/sendEmail');

const emailQueue = new Queue('email', {
    redis: {
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || '',
    },
});

emailQueue.process(async (job) => {
    const { email, subject, message } = job.data;
    try {
        await sendEmail({ email, subject, message });
        console.log(`Email sent to ${email} with subject "${subject}"`);
    } catch (error) {
        console.error(`Failed to send email to ${email}:`, error);
        throw error; // Allows Bull to retry if configured
    }
});

module.exports = emailQueue;
