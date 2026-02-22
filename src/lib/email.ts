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

// 发送支付成功邮件
export async function sendPaymentSuccessEmail(
  email: string,
  name: string,
  booking: { id: string; totalAmount: number; visitDate: Date; visitTime: string },
) {
  const visitDate = new Date(booking.visitDate).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const amount = `¥${(booking.totalAmount / 100).toLocaleString()}`;

  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: email,
    subject: "支付成功 - 江戸和装工房雅",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .container { background: linear-gradient(135deg, #FFF7F5 0%, #FFEEE9 100%); border-radius: 20px; padding: 40px; text-align: center; }
            .logo { font-size: 32px; font-weight: bold; color: #D45B47; margin-bottom: 20px; }
            h1 { color: #16a34a; margin-bottom: 20px; }
            .amount { font-size: 28px; font-weight: bold; color: #D45B47; margin: 20px 0; }
            .info { background: white; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: left; }
            .info-row { padding: 8px 0; border-bottom: 1px solid #f0f0f0; }
            .info-row:last-child { border-bottom: none; }
            .footer { margin-top: 30px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">江戸和装工房雅</div>
            <h1>支付成功</h1>
            <p>尊敬的 ${name}，您的在线支付已成功完成！</p>
            <div class="amount">${amount}</div>
            <div class="info">
              <div class="info-row"><strong>预约编号：</strong>${booking.id.slice(0, 8)}</div>
              <div class="info-row"><strong>到店日期：</strong>${visitDate} ${booking.visitTime}</div>
              <div class="info-row"><strong>支付方式：</strong>在线支付 (Stripe)</div>
            </div>
            <p>请在预约时间前15分钟到店，祝您体验愉快！</p>
            <div class="footer">
              <p>如有任何问题，请联系我们</p>
              <p>江戸和装工房雅团队</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `尊敬的 ${name}，您的在线支付已成功完成！\n\n支付金额：${amount}\n预约编号：${booking.id.slice(0, 8)}\n到店日期：${visitDate} ${booking.visitTime}\n\n请在预约时间前15分钟到店。\n\n江戸和装工房雅团队`,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error("Payment success email error:", error);
    return { success: false, error };
  }
}

// 预约确认邮件的 booking 类型
interface BookingForEmail {
  id: string;
  visitDate: Date;
  visitTime: string;
  totalAmount: number;
  userId?: string | null;
  viewToken?: string | null;
  specialRequests?: string | null;
  items: Array<{
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    addOns: string[];
    plan?: { name: string } | null;
    store: { name: string; city: string; address: string };
  }>;
}

// 发送预约确认邮件
export async function sendBookingConfirmationEmail(
  email: string,
  name: string,
  booking: BookingForEmail
) {
  const visitDate = new Date(booking.visitDate).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // 提取店铺（去重）
  const storeNames = [
    ...new Set(booking.items.map((item) => item.store.name)),
  ];
  const storeAddresses = [
    ...new Set(
      booking.items.map((item) => `${item.store.city} ${item.store.address}`)
    ),
  ];

  // 构建预约项目 HTML
  const itemsHtml = booking.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0;">
          ${item.plan?.name || "和服租赁"}
        </td>
        <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; text-align: center;">
          ${item.quantity}
        </td>
        <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; text-align: right;">
          ¥${(item.unitPrice / 100).toLocaleString()}
        </td>
        <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; text-align: right;">
          ¥${(item.totalPrice / 100).toLocaleString()}
        </td>
      </tr>
      ${
        item.addOns.length > 0
          ? `<tr><td colspan="4" style="padding: 4px 0 10px 16px; color: #888; font-size: 13px; border-bottom: 1px solid #f0f0f0;">附加服务: ${item.addOns.join("、")}</td></tr>`
          : ""
      }`
    )
    .join("");

  // 查询链接（仅游客且有 viewToken 时显示）
  const statusUrl =
    !booking.userId && booking.viewToken
      ? `${process.env.NEXTAUTH_URL}/booking/status?token=${booking.viewToken}`
      : null;

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
              background: linear-gradient(135deg, #FFF7F5 0%, #FFEEE9 100%);
              border-radius: 20px;
              padding: 40px;
            }
            .logo {
              font-size: 32px;
              font-weight: bold;
              color: #D45B47;
              margin-bottom: 20px;
              text-align: center;
            }
            h1 {
              color: #D45B47;
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
              padding: 10px 0;
              border-bottom: 1px solid #f0f0f0;
            }
            .info-row:last-child {
              border-bottom: none;
            }
            .info-label {
              font-weight: bold;
              color: #666;
              font-size: 13px;
              margin-bottom: 2px;
            }
            .info-value {
              color: #333;
            }
            .notice {
              background: #FFFBEB;
              border: 1px solid #FDE68A;
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
              background: #D45B47;
              color: white;
              padding: 12px 24px;
              border-radius: 8px;
              text-decoration: none;
              font-weight: bold;
              margin: 10px 0;
            }
            .total-row {
              font-weight: bold;
              font-size: 16px;
              color: #D45B47;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">江戸和装工房雅</div>
            <h1>预约确认</h1>

            <p>尊敬的 ${name}，</p>
            <p>感谢您的预约！您的预约已成功提交，我们将在24小时内与您确认。</p>

            <div class="booking-info">
              <h3 style="margin-top: 0; color: #D45B47;">预约详情</h3>
              <div class="info-row">
                <div class="info-label">预约编号</div>
                <div class="info-value">${booking.id}</div>
              </div>
              <div class="info-row">
                <div class="info-label">到店日期</div>
                <div class="info-value">${visitDate} ${booking.visitTime}</div>
              </div>
              <div class="info-row">
                <div class="info-label">店铺</div>
                <div class="info-value">${storeNames.join("、")}</div>
              </div>
              <div class="info-row">
                <div class="info-label">地址</div>
                <div class="info-value">${storeAddresses.join("；")}</div>
              </div>
            </div>

            <div class="booking-info">
              <h3 style="margin-top: 0; color: #D45B47;">预约项目</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="color: #888; font-size: 13px;">
                    <th style="text-align: left; padding-bottom: 8px;">套餐</th>
                    <th style="text-align: center; padding-bottom: 8px;">数量</th>
                    <th style="text-align: right; padding-bottom: 8px;">单价</th>
                    <th style="text-align: right; padding-bottom: 8px;">小计</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
                <tfoot>
                  <tr class="total-row">
                    <td colspan="3" style="padding-top: 12px; text-align: right;">合计：</td>
                    <td style="padding-top: 12px; text-align: right;">¥${(booking.totalAmount / 100).toLocaleString()}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            ${
              booking.specialRequests
                ? `<div class="booking-info">
              <h3 style="margin-top: 0; color: #D45B47;">备注</h3>
              <p style="margin: 0; color: #555;">${booking.specialRequests}</p>
            </div>`
                : ""
            }

            ${
              statusUrl
                ? `<div style="text-align: center; margin: 24px 0;">
              <p style="color: #555;">随时查看您的预约状态：</p>
              <a href="${statusUrl}" class="button">查看预约详情</a>
            </div>`
                : ""
            }

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
                ? `<div style="text-align: center; margin: 20px 0;">
              <p style="color: #888; font-size: 13px;">注册账户可查看预约历史、获得会员折扣</p>
              <a href="${process.env.NEXTAUTH_URL}/register" style="color: #D45B47; font-size: 13px;">立即注册 →</a>
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
    text: `尊敬的 ${name}，

感谢您的预约！您的预约已成功提交，我们将在24小时内与您确认。

预约详情：
预约编号：${booking.id}
到店日期：${visitDate} ${booking.visitTime}
店铺：${storeNames.join("、")}
地址：${storeAddresses.join("；")}

预约项目：
${booking.items.map((item) => `- ${item.plan?.name || "和服租赁"} x${item.quantity}  ¥${(item.totalPrice / 100).toLocaleString()}`).join("\n")}
合计：¥${(booking.totalAmount / 100).toLocaleString()}
${booking.specialRequests ? `\n备注：${booking.specialRequests}` : ""}
${statusUrl ? `\n查看预约详情：${statusUrl}` : ""}

温馨提示：
- 请在预约时间前15分钟到店
- 到店后工作人员将为您选择合适的和服
- 如需取消或修改预约，请提前3天联系我们
- 预约日前3天取消可全额退款

如有任何问题，请联系我们。

江戸和装工房雅团队`,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error("Email sending error:", error);
    return { success: false, error };
  }
}
