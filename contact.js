const contactEmail = process.env.CONTACT_TO_EMAIL || "contact@saa-archi.com.tn";
const fromEmail = process.env.CONTACT_FROM_EMAIL || "SAA ARCHI <contact@saa-archi.com.tn>";

function clean(value = "") {
  return String(value).replace(/\s+/g, " ").trim();
}

function isEmail(value = "") {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

module.exports = async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Method not allowed" });
  }

  if (!process.env.RESEND_API_KEY) {
    return response.status(500).json({ error: "Email service is not configured" });
  }

  const body = request.body || {};
  const name = clean(body.name);
  const email = clean(body.email);
  const phone = clean(body.phone);
  const subject = clean(body.subject);
  const message = clean(body.message);

  if (!name || !email || !subject || !message || !isEmail(email)) {
    return response.status(400).json({ error: "Invalid form data" });
  }

  const html = `
    <div style="font-family:Arial,sans-serif;color:#151515;line-height:1.6">
      <h2>Nouveau message depuis le site SAA ARCHI</h2>
      <p><strong>Nom:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Téléphone:</strong> ${phone || "Non renseigné"}</p>
      <p><strong>Sujet:</strong> ${subject}</p>
      <hr />
      <p><strong>Message:</strong></p>
      <p>${message.replace(/\n/g, "<br />")}</p>
    </div>
  `;

  const resendResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: contactEmail,
      reply_to: email,
      subject: `Site SAA ARCHI - ${subject}`,
      html,
      text: [
        "Nouveau message depuis le site SAA ARCHI",
        "",
        `Nom: ${name}`,
        `Email: ${email}`,
        `Téléphone: ${phone || "Non renseigné"}`,
        `Sujet: ${subject}`,
        "",
        message,
      ].join("\n"),
    }),
  });

  if (!resendResponse.ok) {
    return response.status(502).json({ error: "Email could not be sent" });
  }

  return response.status(200).json({ ok: true });
};
