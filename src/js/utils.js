const AppUtils = (() => {
  function byId(id) {
    return document.getElementById(id);
  }

  function uid(prefix) {
    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function normalizeScore(value) {
    const normalized = String(value).replace(',', '.').trim();
    if (normalized === '') return '';
    const score = Number(normalized);
    return Number.isFinite(score) && score >= 0 ? score : '';
  }

  function formatScore(value) {
    if (value === '' || value === undefined || value === null) return '';
    return Number(value).toLocaleString('es-ES', { maximumFractionDigits: 2 });
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function toCsv(rows) {
    return rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(';')).join('\n');
  }

  function downloadFile(filename, content, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  return { byId, downloadFile, escapeHtml, formatScore, normalizeScore, toCsv, uid };
})();
