const BackupModule = (() => {
  const { byId, downloadFile } = AppUtils;

  function exportBackup() {
    const date = new Date().toISOString().slice(0, 10);

    downloadFile(
      `respaldo-registro-estudiantil-${date}.json`,
      JSON.stringify(AppStorage.getData(), null, 2),
      'application/json'
    );
  }

  function importBackup(file) {
    if (!file) return;

    const reader = new FileReader();

    reader.onload = async () => {
      const previousData = AppStorage.snapshot();

      try {
        const imported = JSON.parse(reader.result);

        if (
          !Array.isArray(imported.classes) ||
          !Array.isArray(imported.students) ||
          !imported.grades ||
          typeof imported.grades !== 'object'
        ) {
          throw new Error('El archivo no tiene el formato esperado.');
        }

        AppStorage.replaceData(imported);
        await AppStorage.persistNow();
        App.render();
        alert('Respaldo importado correctamente.');
      } catch (error) {
        AppStorage.replaceData(previousData);
        console.error(error);
        alert(error.message || 'No se pudo importar el respaldo.');
      }
    };

    reader.readAsText(file);
  }

  function bindEvents() {
    byId('exportBackup').addEventListener('click', exportBackup);
    byId('importBackup').addEventListener('change', (event) => {
      importBackup(event.target.files[0]);
      event.target.value = '';
    });
  }

  return { bindEvents };
})();
