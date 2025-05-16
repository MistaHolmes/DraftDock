// lib/email.ts
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail', // or use 'smtp.mailgun.org', etc.
  auth: {
    user: process.env.EMAIL_USER,     // your Gmail or SMTP user
    pass: process.env.EMAIL_PASS,     // app password or SMTP pass
  },
});

export const sendCommentNotification = async ({
  to,
  blogTitle,
  commentText,
}: {
  to: string;
  blogTitle: string;
  commentText: string;
}) => {
  const mailOptions = {
    from: `"Blog Platform" <${process.env.EMAIL_USER}>`,
    to,
    subject: `New Comment on Your Blog: "${blogTitle}"`,
    text: `You received a new comment on your blog:\n\n"${commentText}"`,
    html: `<p>You received a new comment on your blog:</p><blockquote>${commentText}</blockquote>`,
  };

  await transporter.sendMail(mailOptions);
};
