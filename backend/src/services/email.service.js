import nodemailer from 'nodemailer';
import logger from '../utils/logger.js';

let transporter = null;
let previewEnabled = false;

async function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT, 10) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
    previewEnabled = false;
    logger.info(`Email transporter configured: ${host}:${port}`);
  } else {
    logger.info('No SMTP configured — creating Ethereal test account for email delivery...');
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      previewEnabled = true;
      logger.info(`Ethereal test account ready: ${testAccount.user}`);
      logger.info(`View sent emails at: https://ethereal.email/login (user: ${testAccount.user}, pass: ${testAccount.pass})`);
    } catch (err) {
      logger.error(`Failed to create Ethereal account: ${err.message}`);
      transporter = nodemailer.createTransport({ jsonTransport: true });
      previewEnabled = false;
    }
  }

  return transporter;
}

function getOtpHtml(code, userName) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background: #f6f5f1; }
        .container { max-width: 480px; margin: 40px auto; background: #fff; border-radius: 10px; border: 1px solid #e8e6e1; overflow: hidden; }
        .header { background: #1F5C4C; padding: 28px 32px; }
        .header h1 { color: #fff; font-size: 20px; margin: 0; font-weight: 600; }
        .header p { color: rgba(255,255,255,0.7); font-size: 13px; margin: 4px 0 0; }
        .body { padding: 32px; }
        .greeting { font-size: 15px; color: #1B2430; margin-bottom: 16px; }
        .message { font-size: 14px; color: #5B6472; line-height: 1.6; margin-bottom: 24px; }
        .otp-box { background: #f6f5f1; border: 2px dashed #1F5C4C; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 24px; }
        .otp-code { font-size: 32px; font-weight: 700; color: #1F5C4C; letter-spacing: 8px; font-family: 'Courier New', monospace; }
        .otp-label { font-size: 12px; color: #5B6472; margin-top: 8px; text-transform: uppercase; letter-spacing: 0.05em; }
        .expiry { font-size: 12px; color: #B3261E; text-align: center; margin-bottom: 20px; }
        .footer { padding: 20px 32px; background: #f6f5f1; border-top: 1px solid #e8e6e1; }
        .footer p { font-size: 12px; color: #9AA1AC; margin: 0; line-height: 1.5; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>CLM Platform</h1>
          <p>Password Reset Request</p>
        </div>
        <div class="body">
          <p class="greeting">Hello ${userName || 'there'},</p>
          <p class="message">We received a request to reset your password. Use the OTP code below to proceed:</p>
          <div class="otp-box">
            <div class="otp-code">${code}</div>
            <div class="otp-label">One-Time Password</div>
          </div>
          <p class="expiry">This code expires in 10 minutes. Do not share it with anyone.</p>
          <p class="message">If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
        </div>
        <div class="footer">
          <p>This is an automated message from CLM Platform. Do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

const emailService = {
  async sendOTPEmail(to, code, userName) {
    try {
      const transport = await getTransporter();

      const info = await transport.sendMail({
        from: process.env.SMTP_FROM || '"CLM Platform" <noreply@clm.local>',
        to,
        subject: `Your OTP Code: ${code}`,
        html: getOtpHtml(code, userName),
      });

      if (previewEnabled) {
        const previewUrl = nodemailer.getTestMessageUrl(info);
        logger.info(`[EMAIL] OTP sent to ${to}`);
        logger.info(`[EMAIL] Preview URL: ${previewUrl}`);
        logger.info(`[EMAIL] OTP code for ${to}: ${code}`);
      } else {
        logger.info(`[EMAIL] OTP sent to ${to}, messageId: ${info.messageId}`);
      }

      return true;
    } catch (err) {
      logger.error(`[EMAIL] Failed to send OTP to ${to}: ${err.message}`);
      logger.info(`[OTP CODE] For ${to}: ${code} (email failed, use this code manually)`);
      return false;
    }
  },
};

export default emailService;
