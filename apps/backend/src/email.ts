import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

export const sendBlogPublishedEmail = async (to: string, blogTitle: string) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('⚠️  Email not configured — skipping blog published email for:', to);
    return;
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail', 
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"DraftDock.app" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Your Blog Has Been Published!',
      html: `
        <div style="background: #ffffff; padding: 32px; font-family: 'Segoe UI', sans-serif; color: #000000;">

          <div style="max-width: 600px; margin: auto; border: 1px solid #000; padding: 24px; border-radius: 8px;">
            <div style="text-align: center; margin-bottom: 32px;">
              <a href="http://localhost:5173/landing" style="text-decoration: none; color: #000;">
                <div style="display: inline-flex; align-items: center; gap: 8px; font-size: 24px; font-weight: bold;">
                  <span style="font-family: serif;">DraftDock</span>
                </div>
              </a>
            </div>
            <h2 style="font-size: 22px; font-weight: bold; margin-bottom: 16px;">🎉 Blog Published Successfully</h2>
            <p style="font-size: 16px; margin-bottom: 16px;">
              Your blog titled <strong>${blogTitle}</strong> has been successfully published on <strong>DraftDock</strong>.
            </p>
            <p style="margin-bottom: 24px;">You can view or manage it from your dashboard.</p>
            <div style="text-align: center; margin: 24px 0;">
              <a href="http://localhost:5173/profile" target="_blank" 
                style="display: inline-block; padding: 12px 24px; background: #000; color: #fff; text-decoration: none; font-weight: bold; border-radius: 4px;">
                Go to Dashboard
              </a>
            </div>
            <p style="font-size: 14px; color: #666;">— Team DraftDock</p>
          </div>
        </div>
      `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`📧 Email sent to ${to}`);
  } catch (err) {
    console.error('❌ Failed to send email:', err);
    throw err;
  }
};
