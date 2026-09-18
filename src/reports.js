export const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function sourceUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}
const date = value => {
  const parsed = new Date(value ?? '');
  return Number.isNaN(parsed.getTime()) ? 'Not recorded' : parsed.toISOString().slice(0,10);
};
const statuses = {pending:'Being prepared',ready:'Ready to view',failed:'Preparation failed',refunded:'Refunded'};

export function renderReportList(reports) {
  if (!reports.length) return '<p>No purchased reports yet. The free research checklist is available above.</p>';
  return '<p>Your latest reports (up to 50).</p>' + reports.map(r => `<article class="report-list-item"><h3>${escapeHtml(r.business_types?.name ?? r.business_type_id)} · ${escapeHtml(r.jurisdictions?.name ?? r.jurisdiction_id)}</h3><p>${date(r.created_at)} · ${escapeHtml(statuses[r.status] ?? 'Status unavailable')}</p>${r.status === 'ready' ? `<button type="button" data-report="${escapeHtml(r.id)}">View saved report</button>` : ''}</article>`).join('');
}

// Render only the immutable report snapshot. Do not substitute today's catalog data.
export function renderSavedReport(report, items) {
  if (report.status !== 'ready') return '<p>This report is not available to view.</p>';
  if (!items.length) return '<p>The saved report has no requirement snapshots. Please contact support before relying on it.</p>';
  const rows = items.map(item => {
    const r = item.snapshot && typeof item.snapshot === 'object' ? item.snapshot : {};
    const source = r.source ?? r.sources;
    const href = sourceUrl(source?.url);
    return `<article><p class="eyebrow">Saved version ${escapeHtml(item.version)} · Source checked ${date(r.verified_at)}</p><h3>${escapeHtml(r.title ?? 'Untitled requirement')}</h3><p>${escapeHtml(r.explanation ?? 'Explanation not recorded.')}</p><p>Applicability: ${escapeHtml(r.applicability ?? 'Not recorded')}</p><p>${r.fee_amount != null ? `Listed fee: $${escapeHtml(r.fee_amount)}` : escapeHtml(r.fee_note ?? 'Fee not recorded')}${r.renewal ? ' · '+escapeHtml(r.renewal) : ''}</p>${href ? `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(source.agency ?? source.title ?? 'Saved source')} ↗</a>` : '<p>Source link was not captured in this saved report. Confirm with the responsible agency.</p>'}</article>`;
  }).join('');
  const answers = report.answers && typeof report.answers === 'object' && !Array.isArray(report.answers) ? report.answers : {};
  return `<h2>PermitPorch saved research report</h2><p>Report ${escapeHtml(report.id)} · Created ${date(report.created_at)}</p><p>${escapeHtml(report.business_types?.name ?? report.business_type_id)} · ${escapeHtml(report.jurisdictions?.name ?? report.jurisdiction_id)}</p><details open><summary>Saved questionnaire answers</summary><dl>${Object.entries(answers).map(([key,value]) => `<dt>${escapeHtml(key.replaceAll('_',' '))}</dt><dd>${escapeHtml(typeof value === 'object' ? JSON.stringify(value) : value)}</dd>`).join('') || '<p>No answers recorded.</p>'}</dl></details><p>This is a saved research snapshot, not a live compliance determination. Sources and requirements may have changed since preparation. Missing items do not establish an exemption; confirm relevant requirements with the responsible agencies.</p><div class="results">${rows}</div>`;
}
