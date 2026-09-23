const ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (ch) => ESCAPES[ch] ?? ch);
}

function page(title: string, body: string): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>
<style>body{font-family:system-ui,sans-serif;background:#F6F5F1;color:#1C1B19;display:grid;place-items:center;min-height:100vh;margin:0;padding:16px}
main{background:#FFFFFF;border:1px solid #E3E0D8;border-radius:12px;padding:24px;max-width:28rem}h1{font-size:24px;margin:0 0 8px}p{color:#5E5B54;line-height:1.5}</style>
</head><body><main>${body}</main></body></html>`;
}

export function accessDeniedPage(email: string): string {
  const who = email
    ? `You are signed in as <strong>${escapeHtml(email)}</strong>, which is not on the allowed list.`
    : 'Google did not share which account you are signed in with, so access cannot be checked.';
  return page(
    'Access denied',
    `<h1>Access denied</h1><p>${who}</p><p>Ask the owner of this app to add your email in Settings.</p>`,
  );
}

export function setupNeededPage(message: string): string {
  return page('Setup needed', `<h1>Setup needed</h1><p>${escapeHtml(message)}</p>`);
}
