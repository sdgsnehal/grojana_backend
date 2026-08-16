import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const resetPasswordHtml = (name: string, code: string) => `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 0;font-family:Arial,Helvetica,sans-serif;">
  <tr>
    <td align="center">
      <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;">
        <tr>
          <td style="padding:40px 40px 24px;text-align:center;">
            <h1 style="margin:0 0 16px;font-size:22px;color:#111827;">Reset password</h1>
            <p style="margin:0 0 8px;font-size:15px;color:#374151;">Hey ${name},</p>
            <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.5;">
              Use the code below to reset your password. It expires in 10 minutes.
            </p>
            <div style="display:inline-block;padding:14px 28px;background:#fff7ed;border:1px solid #fdba74;border-radius:8px;font-size:28px;font-weight:bold;letter-spacing:8px;color:#c2410c;">
              ${code}
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding:0 40px 32px;text-align:center;">
            <p style="margin:0;font-size:13px;color:#6b7280;">
              If you did not request a password change, no worries — simply ignore this email.
            </p>
          </td>
        </tr>
      </table>
      <p style="margin:24px 0 0;font-size:12px;color:#9ca3af;">Grojana</p>
    </td>
  </tr>
</table>`;

export const sendResetPasswordEmail = async (
  email: string,
  code: string,
  name = "there",
) => {
  await resend.emails.send({
    from: process.env.EMAIL_FROM || "onboarding@resend.dev",
    to: email,
    subject: "Reset your password",
    html: resetPasswordHtml(name, code),
    text: `Hey ${name}, your password reset code is ${code}. It expires in 10 minutes. If you did not request this, ignore this email.`,
  });
};
