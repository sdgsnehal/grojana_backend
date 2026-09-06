interface WhatsappOrderItem {
  product: { name?: string } | null;
  quantity: number;
  weight: string;
  price: number;
  totalPrice: number;
}

interface WhatsappOrderAddress {
  name: string;
  mobile: number;
  streetAddress: string;
  address: string;
  city: string;
  state: string;
  zip: number;
}

interface WhatsappOrderDetails {
  orderNumber: string;
  items: WhatsappOrderItem[];
  totalAmount: number;
  paymentMethod: string;
  shippingAddress: WhatsappOrderAddress;
}

const GRAPH_API_VERSION = process.env.WHATSAPP_API_VERSION || "v22.0";
const GRAPH_API_BASE = "https://graph.facebook.com";

// shippingAddress.mobile is stored as a bare Number with no country code.
// Defaults to prefixing WHATSAPP_DEFAULT_COUNTRY_CODE onto 10-digit numbers;
// revisit once real customer number formats are confirmed.
const toWhatsappPhone = (mobile: number): string => {
  const digits = String(mobile).replace(/\D/g, "");
  const countryCode = process.env.WHATSAPP_DEFAULT_COUNTRY_CODE || "91";
  return digits.length === 10 ? `${countryCode}${digits}` : digits;
};

const formatOrderItems = (items: WhatsappOrderItem[]): string =>
  items
    .map(
      (item) =>
        `${item.quantity}x ${item.product?.name || "Item"} (${item.weight})`,
    )
    .join(", ");

const estimatedDeliveryDate = (): string => {
  const days = Number(process.env.WHATSAPP_ORDER_DELIVERY_DAYS || "5");
  const date = new Date();
  date.setDate(date.getDate() + (Number.isFinite(days) ? days : 5));
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export const sendOrderConfirmationWhatsapp = async (
  mobile: number,
  name: string,
  order: WhatsappOrderDetails,
) => {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const templateName =
    process.env.WHATSAPP_ORDER_TEMPLATE_NAME || "order_confirmation_placeholder";
  const templateLang = process.env.WHATSAPP_ORDER_TEMPLATE_LANG || "en_US";

  if (!accessToken || !phoneNumberId) {
    throw new Error(
      "WhatsApp is not configured: WHATSAPP_ACCESS_TOKEN / WHATSAPP_PHONE_NUMBER_ID missing",
    );
  }

  // Matches the approved template body:
  //   Hi {{customer_name}}, thank you for your order!
  //   Order ID: {{order_id}}
  //   Items: {{order_items}}
  //   Total: {{order_total}}
  //   Estimated delivery: {{delivery_date}}
  const payload = {
    messaging_product: "whatsapp",
    to: toWhatsappPhone(mobile),
    type: "template",
    template: {
      name: templateName,
      language: { code: templateLang },
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", parameter_name: "customer_name", text: name },
            {
              type: "text",
              parameter_name: "order_id",
              text: order.orderNumber,
            },
            {
              type: "text",
              parameter_name: "order_items",
              text: formatOrderItems(order.items),
            },
            {
              type: "text",
              parameter_name: "order_total",
              text: `₹${order.totalAmount}`,
            },
            {
              type: "text",
              parameter_name: "delivery_date",
              text: estimatedDeliveryDate(),
            },
          ],
        },
      ],
    },
  };

  const response = await fetch(
    `${GRAPH_API_BASE}/${GRAPH_API_VERSION}/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`WhatsApp API error (${response.status}): ${errorBody}`);
  }

  return response.json();
};
