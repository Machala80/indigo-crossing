// Sends one email through Brevo's transactional email API.
// Needs BREVO_API_KEY and BREVO_SENDER_EMAIL set in the Convex dashboard.
// Without a key (e.g. local testing) the email is written to the logs instead.

export async function sendBrevo(opts: {
  to: string;
  subject: string;
  html: string;
  text: string;
  headers?: Record<string, string>;
}): Promise<void> {
  const key = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const senderName = process.env.BREVO_SENDER_NAME || "Indigo Estate";
  if (!key || !senderEmail) {
    console.log(`[email not sent: Brevo not configured] to=${opts.to} subject=${opts.subject}\n${opts.text}`);
    return;
  }
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": key,
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      sender: { email: senderEmail, name: senderName },
      to: [{ email: opts.to }],
      subject: opts.subject,
      htmlContent: opts.html,
      textContent: opts.text,
      headers: opts.headers,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Brevo send failed (${res.status}): ${body.slice(0, 300)}`);
  }
}

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Branded email shell: deep indigo band, gold title, plain readable body. */
export function emailHtml(title: string, paragraphs: string[], button?: { label: string; url: string }, footer?: string): string {
  return `<!doctype html><html><body style="margin:0;background:#EFF8F8;font-family:Georgia,'Times New Roman',serif;color:#33204F">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#EFF8F8"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #E1D7EA">
<tr><td style="background:#2A1550;padding:22px 28px">
<div style="font-family:Arial,sans-serif;font-size:11px;letter-spacing:3px;color:#F5D87A;text-transform:uppercase">Indigo Estate</div>
<div style="font-size:26px;color:#E9CF8E;letter-spacing:1px;margin-top:6px">${esc(title)}</div></td></tr>
<tr><td style="padding:24px 28px;font-size:16px;line-height:1.6">
${paragraphs.map((p) => `<p style="margin:0 0 14px">${esc(p)}</p>`).join("")}
${button ? `<p style="margin:22px 0 6px"><a href="${esc(button.url)}" style="background:#C9A96E;color:#2A1846;text-decoration:none;font-family:Arial,sans-serif;font-weight:bold;font-size:13px;letter-spacing:2px;text-transform:uppercase;padding:13px 22px;border-radius:999px;display:inline-block">${esc(button.label)}</a></p>` : ""}
</td></tr>
${footer ? `<tr><td style="padding:14px 28px 22px;font-family:Arial,sans-serif;font-size:12px;color:#6A5A86;border-top:1px solid #E1D7EA">${footer}</td></tr>` : ""}
</table></td></tr></table></body></html>`;
}
