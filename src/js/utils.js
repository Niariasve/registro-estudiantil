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

  /**
   * Modal de confirmación personalizado en HTML.
   * Reemplaza el confirm() nativo del navegador.
   * Devuelve una Promise<boolean>.
   */
  function confirmModal(message) {
    return new Promise((resolve) => {
      // Reutilizar modal existente o crear uno nuevo
      let overlay = byId('_confirmModalOverlay');
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = '_confirmModalOverlay';
        overlay.innerHTML = `
          <div id="_confirmModalBox">
            <p id="_confirmModalMsg"></p>
            <div class="confirm-modal-actions">
              <button id="_confirmModalCancel" class="secondary">Cancelar</button>
              <button id="_confirmModalOk" class="danger">Eliminar</button>
            </div>
          </div>`;
        document.body.appendChild(overlay);
      }

      byId('_confirmModalMsg').textContent = message;
      overlay.classList.add('visible');

      function cleanup(result) {
        overlay.classList.remove('visible');
        byId('_confirmModalOk').onclick = null;
        byId('_confirmModalCancel').onclick = null;
        overlay.onclick = null;
        resolve(result);
      }

      byId('_confirmModalOk').onclick = () => cleanup(true);
      byId('_confirmModalCancel').onclick = () => cleanup(false);
      // Click fuera del box = cancelar
      overlay.onclick = (e) => { if (e.target === overlay) cleanup(false); };
    });
  }

  return { byId, confirmModal, downloadFile, escapeHtml, formatScore, normalizeScore, toCsv, uid };
})();
