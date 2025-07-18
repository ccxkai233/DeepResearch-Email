import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export async function sendEmail({ to, subject, text, html }: EmailOptions) {
  // 1. Check for email configuration in environment variables
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_PORT || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error("错误：邮件服务未配置。请在 .env 文件中添加 EMAIL_HOST, EMAIL_PORT, EMAIL_USER, 和 EMAIL_PASS。");
    throw new Error("邮件服务配置不完整。");
  }

  // 2. Create a transporter object using SMTP transport
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT, 10),
    secure: parseInt(process.env.EMAIL_PORT, 10) === 465, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER, // Your email address
      pass: process.env.EMAIL_PASS, // Your email password or app-specific password
    },
  });

  // 3. Send mail with defined transport object
  try {
    const info = await transporter.sendMail({
      from: `"Deep Research Bot" <${process.env.EMAIL_USER}>`, // sender address
      to: to, // list of receivers
      subject: subject, // Subject line
      text: text, // plain text body
      html: html, // html body
    });

    console.log(`✅ 邮件已发送: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error("❌ 发送邮件时出错:", error);
    throw error;
  }
}