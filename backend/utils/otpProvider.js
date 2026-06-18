// Provider abstraction for OTP delivery. Lets the app verify phone numbers
// today (console/stub) and drop in WhatsApp Business Cloud API later by only
// setting environment variables — no code changes to the OTP flow.
//
// Env:
//   OTP_PROVIDER = "console" (default) | "whatsapp_cloud"
//   WHATSAPP_TOKEN, WHATSAPP_PHONE_ID, WHATSAPP_TEMPLATE (for whatsapp_cloud)

function isProduction() {
  return String(process.env.NODE_ENV).toLowerCase() === "production";
}

async function sendViaConsole(phone, code) {
  // Safe stub: never logs full code in production.
  if (!isProduction()) {
    console.log(`[OTP] (console provider) code for ${phone}: ${code}`);
  } else {
    console.log(`[OTP] (console provider) code dispatched to ${phone}`);
  }
  return { ok: true, provider: "console", devCodeExposed: !isProduction() };
}

async function sendViaWhatsAppCloud(phone, code) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_ID;
  if (!token || !phoneId) {
    // Misconfigured — fail soft to the console provider so registration never breaks.
    console.warn("[OTP] whatsapp_cloud selected but credentials missing; using console provider.");
    return sendViaConsole(phone, code);
  }
  try {
    const url = `https://graph.facebook.com/v19.0/${phoneId}/messages`;
    const body = {
      messaging_product: "whatsapp",
      to: phone,
      type: "text",
      text: { body: `Your FIA Cyber Crime portal verification code is ${code}. It expires in 10 minutes.` },
    };
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!resp.ok) {
      console.warn("[OTP] WhatsApp send failed:", resp.status);
      return { ok: false, provider: "whatsapp_cloud" };
    }
    return { ok: true, provider: "whatsapp_cloud", devCodeExposed: false };
  } catch (err) {
    console.warn("[OTP] WhatsApp send error:", err?.message || err);
    return { ok: false, provider: "whatsapp_cloud" };
  }
}

async function sendOtp(phone, code) {
  const provider = String(process.env.OTP_PROVIDER || "console").toLowerCase();
  if (provider === "whatsapp_cloud") return sendViaWhatsAppCloud(phone, code);
  return sendViaConsole(phone, code);
}

module.exports = { sendOtp, isProduction };
