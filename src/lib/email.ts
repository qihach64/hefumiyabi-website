import nodemailer from "nodemailer";

// 创建邮件传输器
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_PORT === "465", // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

// 发送验证邮件
export async function sendVerificationEmail(email: string, token: string) {
  const verificationUrl = `${process.env.NEXTAUTH_URL}/verify-email?token=${token}`;

  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: email,
    subject: "验证您的邮箱 - 江戸和装工房雅",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background: linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%);
              border-radius: 20px;
              padding: 40px;
              text-align: center;
            }
            .logo {
              font-size: 32px;
              font-weight: bold;
              color: #be123c;
              margin-bottom: 20px;
            }
            h1 {
              color: #be123c;
              margin-bottom: 20px;
            }
            .button {
              display: inline-block;
              background: linear-gradient(135deg, #be123c 0%, #db2777 100%);
              color: white;
              padding: 16px 32px;
              border-radius: 12px;
              text-decoration: none;
              font-weight: bold;
              margin: 30px 0;
              box-shadow: 0 4px 15px rgba(190, 18, 60, 0.3);
            }
            .footer {
              margin-top: 30px;
              font-size: 12px;
              color: #666;
            }
            .code {
              background: white;
              padding: 15px;
              border-radius: 8px;
              font-family: monospace;
              font-size: 14px;
              color: #666;
              margin: 20px 0;
              word-break: break-all;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">🌸 江戸和装工房雅</div>
            <h1>欢迎注册！</h1>
            <p>感谢您注册江戸和装工房雅。请点击下方按钮验证您的邮箱地址：</p>

            <a href="${verificationUrl}" class="button">验证邮箱</a>

            <p style="margin-top: 30px;">或复制以下链接到浏览器：</p>
            <div class="code">${verificationUrl}</div>

            <div class="footer">
              <p>此验证链接将在 24 小时后失效</p>
              <p>如果您没有注册此账户，请忽略此邮件</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
      欢迎注册江戸和装工房雅！

      请访问以下链接验证您的邮箱地址：
      ${verificationUrl}

      此验证链接将在 24 小时后失效。
      如果您没有注册此账户，请忽略此邮件。
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error("Email sending error:", error);
    return { success: false, error };
  }
}

// 发送密码重置邮件
export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;

  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: email,
    subject: "重置密码 - 江戸和装工房雅",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background: linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%);
              border-radius: 20px;
              padding: 40px;
              text-align: center;
            }
            .logo {
              font-size: 32px;
              font-weight: bold;
              color: #be123c;
              margin-bottom: 20px;
            }
            h1 {
              color: #be123c;
              margin-bottom: 20px;
            }
            .button {
              display: inline-block;
              background: linear-gradient(135deg, #be123c 0%, #db2777 100%);
              color: white;
              padding: 16px 32px;
              border-radius: 12px;
              text-decoration: none;
              font-weight: bold;
              margin: 30px 0;
              box-shadow: 0 4px 15px rgba(190, 18, 60, 0.3);
            }
            .footer {
              margin-top: 30px;
              font-size: 12px;
              color: #666;
            }
            .code {
              background: white;
              padding: 15px;
              border-radius: 8px;
              font-family: monospace;
              font-size: 14px;
              color: #666;
              margin: 20px 0;
              word-break: break-all;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">🌸 江戸和装工房雅</div>
            <h1>重置您的密码</h1>
            <p>我们收到了您的密码重置请求。请点击下方按钮设置新密码：</p>

            <a href="${resetUrl}" class="button">重置密码</a>

            <p style="margin-top: 30px;">或复制以下链接到浏览器：</p>
            <div class="code">${resetUrl}</div>

            <div class="footer">
              <p>此重置链接将在 1 小时后失效</p>
              <p>如果您没有请求重置密码，请忽略此邮件，您的账户仍然安全</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
      请访问以下链接重置您的密码：
      ${resetUrl}

      此重置链接将在 1 小时后失效。
      如果您没有请求重置密码，请忽略此邮件。
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error("Password reset email error:", error);
    return { success: false, error };
  }
}

// 发送预约确认邮件
export async function sendBookingConfirmationEmail(
  email: string,
  name: string,
  booking: any
) {
  const storeName = booking.store?.name || "店铺";
  const planName = booking.plan?.name || "和服租赁服务";
  const rentalDate = new Date(booking.rentalDate).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const returnDate = new Date(booking.returnDate).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: email,
    subject: "预约确认 - 江戸和装工房雅",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background: linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%);
              border-radius: 20px;
              padding: 40px;
            }
            .logo {
              font-size: 32px;
              font-weight: bold;
              color: #be123c;
              margin-bottom: 20px;
              text-align: center;
            }
            h1 {
              color: #be123c;
              margin-bottom: 20px;
              text-align: center;
            }
            .booking-info {
              background: white;
              border-radius: 12px;
              padding: 20px;
              margin: 20px 0;
            }
            .info-row {
              display: flex;
              padding: 12px 0;
              border-bottom: 1px solid #f0f0f0;
            }
            .info-row:last-child {
              border-bottom: none;
            }
            .info-label {
              font-weight: bold;
              color: #666;
              width: 120px;
              flex-shrink: 0;
            }
            .info-value {
              color: #333;
            }
            .notice {
              background: #fff3cd;
              border: 1px solid #ffc107;
              border-radius: 8px;
              padding: 15px;
              margin: 20px 0;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              font-size: 12px;
              color: #666;
            }
            .button {
              display: inline-block;
              background: linear-gradient(135deg, #be123c 0%, #db2777 100%);
              color: white;
              padding: 12px 24px;
              border-radius: 8px;
              text-decoration: none;
              font-weight: bold;
              margin: 10px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">🌸 江戸和装工房雅</div>
            <h1>预约确认</h1>

            <p>尊敬的 ${name}，</p>
            <p>感谢您的预约！您的预约已成功提交，我们将在24小时内与您确认。</p>

            <div class="booking-info">
              <h3 style="margin-top: 0; color: #be123c;">预约详情</h3>
              <div class="info-row">
                <div class="info-label">预约编号：</div>
                <div class="info-value">${booking.id}</div>
              </div>
              <div class="info-row">
                <div class="info-label">套餐：</div>
                <div class="info-value">${planName}</div>
              </div>
              <div class="info-row">
                <div class="info-label">店铺：</div>
                <div class="info-value">${storeName}</div>
              </div>
              <div class="info-row">
                <div class="info-label">租赁日期：</div>
                <div class="info-value">${rentalDate}</div>
              </div>
              <div class="info-row">
                <div class="info-label">归还日期：</div>
                <div class="info-value">${returnDate}</div>
              </div>
              ${
                booking.pickupTime
                  ? `<div class="info-row">
                  <div class="info-label">取衣时间：</div>
                  <div class="info-value">${booking.pickupTime}</div>
                </div>`
                  : ""
              }
              ${
                booking.addOns && booking.addOns.length > 0
                  ? `<div class="info-row">
                  <div class="info-label">附加服务：</div>
                  <div class="info-value">${booking.addOns.join(", ")}</div>
                </div>`
                  : ""
              }
            </div>

            <div class="notice">
              <strong>温馨提示：</strong>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>请在预约时间前15分钟到店</li>
                <li>到店后工作人员将为您选择合适的和服</li>
                <li>如需取消或修改预约，请提前3天联系我们</li>
                <li>预约日前3天取消可全额退款</li>
              </ul>
            </div>

            ${
              !booking.userId
                ? `<div style="text-align: center; margin: 30px 0;">
              <p>注册账户可享受更多优惠和便捷服务！</p>
              <a href="${process.env.NEXTAUTH_URL}/register" class="button">立即注册</a>
            </div>`
                : ""
            }

            <div class="footer">
              <p>如有任何问题，请联系我们</p>
              <p>江戸和装工房雅团队</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
      尊敬的 ${name}，

      感谢您的预约！您的预约已成功提交，我们将在24小时内与您确认。

      预约详情：
      预约编号：${booking.id}
      套餐：${planName}
      店铺：${storeName}
      租赁日期：${rentalDate}
      归还日期：${returnDate}

      温馨提示：
      - 请在预约时间前15分钟到店
      - 到店后工作人员将为您选择合适的和服
      - 如需取消或修改预约，请提前3天联系我们
      - 预约日前3天取消可全额退款

      如有任何问题，请联系我们。

      江戸和装工房雅团队
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error("Email sending error:", error);
    return { success: false, error };
  }
}
