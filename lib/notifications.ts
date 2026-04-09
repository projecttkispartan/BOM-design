interface EmailPayload {
  to: string | string[];
  subject: string;
  html: string;
}

function normalizeRecipients(to: string | string[]): string[] {
  return Array.isArray(to) ? to : [to];
}

export async function sendEmail(payload: EmailPayload): Promise<{ sent: boolean; reason?: string }> {
  const apiKey = process.env.SENDGRID_API_KEY;
  const from = process.env.SENDGRID_FROM_EMAIL;
  if (!apiKey || !from) {
    return { sent: false, reason: 'SENDGRID_API_KEY or SENDGRID_FROM_EMAIL not configured' };
  }

  const recipients = normalizeRecipients(payload.to).filter(Boolean);
  if (recipients.length === 0) return { sent: false, reason: 'No recipients configured' };

  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [
        {
          to: recipients.map((email) => ({ email })),
          subject: payload.subject,
        },
      ],
      from: { email: from },
      content: [{ type: 'text/html', value: payload.html }],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    return { sent: false, reason: text || `SendGrid error ${response.status}` };
  }
  return { sent: true };
}

export async function sendApprovalRequestEmail(input: {
  bomCode: string;
  bomName: string;
  reviewUrl: string;
  recipients: string[];
}): Promise<void> {
  if (!input.recipients.length) return;
  await sendEmail({
    to: input.recipients,
    subject: `BOM ${input.bomCode} submitted for review`,
    html: `
      <p>Hello,</p>
      <p>BOM <strong>${input.bomCode}</strong> - ${input.bomName} has been submitted for review.</p>
      <p>Open review: <a href="${input.reviewUrl}">${input.reviewUrl}</a></p>
    `,
  });
}

export async function sendWeeklyOwnerSummary(input: {
  ownerEmails: string[];
  summaryRows: Array<{ bomCode: string; bomName: string; reasons: string[] }>;
}): Promise<void> {
  if (!input.ownerEmails.length) return;

  const rows = input.summaryRows
    .map(
      (item) =>
        `<tr><td style="padding:6px 8px;border:1px solid #ddd;">${item.bomCode}</td><td style="padding:6px 8px;border:1px solid #ddd;">${item.bomName}</td><td style="padding:6px 8px;border:1px solid #ddd;">${item.reasons.join(', ')}</td></tr>`,
    )
    .join('');

  await sendEmail({
    to: input.ownerEmails,
    subject: 'Weekly BOM review summary',
    html: `
      <p>Weekly summary for BOMs requiring review:</p>
      <table style="border-collapse:collapse">
        <thead><tr><th style="padding:6px 8px;border:1px solid #ddd;">BOM</th><th style="padding:6px 8px;border:1px solid #ddd;">Name</th><th style="padding:6px 8px;border:1px solid #ddd;">Reasons</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    `,
  });
}

