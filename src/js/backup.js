const BackupModule = (() => {
  const { byId, downloadFile } = AppUtils;

  function exportBackup() {
    downloadFile('respaldo-registro-estudiantil.json', JSON.stringify(AppStorage.getData(), null, 2), 'application/json');
  }

  function importBackup(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = JSON.parse(reader.result);
        if (!Array.isArray(imported.classes) || !Array.isArray(imported.students) || !imported.grades) {
          throw new Error('Formato inválido');
        }
        AppStorage.replaceData(imported);
        App.render();
        App.showHome();
      } catch {
        alert('No se pudo importar el respaldo.');
      }
    };
    reader.readAsText(file);
  }

  function bindEvents() {
    byId('exportBackup').addEventListener('click', exportBackup);
    byId('importBackup').addEventListener('change', (event) => importBackup(event.target.files[0]));
  }

  return { bindEvents };
})();
