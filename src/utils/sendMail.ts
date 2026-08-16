import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface OrderEmailItem {
  product: { name?: string } | null;
  quantity: number;
  weight: string;
  price: number;
  totalPrice: number;
}

interface OrderEmailAddress {
  name: string;
  mobile: number;
  streetAddress: string;
  address: string;
  city: string;
  state: string;
  zip: number;
}

interface OrderEmailDetails {
  orderNumber: string;
  items: OrderEmailItem[];
  totalAmount: number;
  paymentMethod: string;
  shippingAddress: OrderEmailAddress;
}

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

const orderConfirmationHtml = (name: string, order: OrderEmailDetails) => {
  const itemRows = order.items
    .map(
      (item) => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-size:14px;color:#111827;">${item.product?.name || "Product"}<br/><span style="color:#6b7280;font-size:12px;">${item.weight} × ${item.quantity}</span></td>
          <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-size:14px;color:#111827;text-align:right;">₹${item.totalPrice}</td>
        </tr>`
    )
    .join("");

  const address = order.shippingAddress;

  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 0;font-family:Arial,Helvetica,sans-serif;">
  <tr>
    <td align="center">
      <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;">
        <tr>
          <td style="padding:40px 40px 8px;text-align:center;">
            <h1 style="margin:0 0 16px;font-size:22px;color:#111827;">Order placed</h1>
            <p style="margin:0 0 8px;font-size:15px;color:#374151;">Hey ${name},</p>
            <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.5;">
              Thanks for your order! Here's a summary of order <b>#${order.orderNumber}</b>.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:0 40px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              ${itemRows}
              <tr>
                <td style="padding:14px 0 0;font-size:15px;font-weight:bold;color:#111827;">Total</td>
                <td style="padding:14px 0 0;font-size:15px;font-weight:bold;color:#111827;text-align:right;">₹${order.totalAmount}</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 40px 0;">
            <p style="margin:0 0 4px;font-size:13px;font-weight:bold;color:#111827;">Shipping to</p>
            <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.5;">
              ${address.name}, ${address.streetAddress}, ${address.address}, ${address.city}, ${address.state} ${address.zip}
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 40px 32px;">
            <p style="margin:0;font-size:13px;color:#6b7280;">
              Payment method: ${order.paymentMethod.replace(/_/g, " ")}. We'll email you again once your order ships.
            </p>
          </td>
        </tr>
      </table>
      <p style="margin:24px 0 0;font-size:12px;color:#9ca3af;">Grojana</p>
    </td>
  </tr>
</table>`;
};

export const sendOrderConfirmationEmail = async (
  email: string,
  name: string,
  order: OrderEmailDetails
) => {
  await resend.emails.send({
    from: process.env.EMAIL_FROM || "onboarding@resend.dev",
    to: email,
    subject: `Order confirmed — #${order.orderNumber}`,
    html: orderConfirmationHtml(name, order),
    text: `Hey ${name}, your order #${order.orderNumber} has been placed. Total: ₹${order.totalAmount}. We'll email you again once it ships.`,
  });
};

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
