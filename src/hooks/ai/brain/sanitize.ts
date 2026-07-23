const BRAIN_TOOL_NAMES = [
  'create_alert','escalate_alert','notify_user','send_pix_reminder',
  'create_follow_up_task','save_memory','block_client',
  'reschedule_production_order','create_purchase_order',
  'release_order_block','mark_invoice_paid','assign_sales_rep',
  'log_observation','generate_report',
];

export function sanitizeBrainText(s: string): string {
  if (!s) return s;
  let out = s;
  out = out.replace(/```(?:tool_code|tool_call|json|function)?\s*\n?([\s\S]*?)```/gi, (m, body: string) =>
    BRAIN_TOOL_NAMES.some((n) => body.includes(n)) ? '' : m,
  );
  out = out.replace(/<\/?tool_call[^>]*>[\s\S]*?(<\/tool_call>|$)/gi, '');
  for (const name of BRAIN_TOOL_NAMES) {
    out = out.replace(new RegExp(`\\b${name}\\b\\s*\\(\\s*\\{[\\s\\S]*?\\}\\s*\\)\\s*;?`, 'g'), '');
    out = out.replace(new RegExp(`\\b${name}\\b\\s*\\(\\s*\\{[\\s\\S]*?(?=\\n\\n|$)`, 'g'), '');
    out = out.replace(new RegExp(`\\b${name}\\b\\s*\\([^\\n]*`, 'g'), '');
    out = out.replace(new RegExp(`(^|\\s)${name}(?=\\s|$|[:.,;])`, 'g'), '$1');
  }
  return out.replace(/\n{3,}/g, '\n\n').trim();
}
