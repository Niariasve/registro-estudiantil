const ClassesModule = (() => {
  const { byId, confirmModal, escapeHtml, formatScore, uid } = AppUtils;

  async function addClass() {
    const input = byId('className');
    const name = input.value.trim();
    if (!name) return alert('Escribí el nombre de la clase.');
    const classItem = { id: uid('class'), name, activities: [] };
    const data = AppStorage.getData();
    const previousSelectedClassId = data.selectedClassId;
    data.classes.push(classItem);
    data.selectedClassId = classItem.id;

    try {
      await AppStorage.persistNow();
      input.value = '';
      App.showClass(classItem.id);
    } catch (err) {
      console.error("Error al agregar clase:", err);
      data.classes = data.classes.filter((item) => item.id !== classItem.id);
      data.selectedClassId = previousSelectedClassId;
      alert('No se pudo guardar la clase en la base de datos.');
    }
  }

  async function deleteClass(classId) {
    const data = AppStorage.getData();
    const classItem = data.classes.find((item) => item.id === classId);
    if (!classItem) return;

    const confirmed = await confirmModal(`¿Eliminar "${classItem.name}"? También se eliminarán sus actividades y notas.`);
    if (!confirmed) return;

    const activityIds = classItem.activities.map((activity) => activity.id);
    Object.keys(data.grades).forEach((key) => {
      if (activityIds.some((activityId) => key.endsWith(`:${activityId}`))) delete data.grades[key];
    });

    data.classes = data.classes.filter((item) => item.id !== classId);
    if (data.selectedClassId === classId) {
      data.selectedClassId = data.classes[0] ? data.classes[0].id : null;
    }

    // Actualizar UI inmediatamente antes de esperar Firestore
    App.render();

    try {
      if (AppStorage.isFirebaseActive()) {
        await AppStorage.deleteClassFromFirestore(classId);
      } else {
        await AppStorage.persistNow();
      }
    } catch (err) {
      console.error("Error al eliminar clase:", err);
      alert('Error al guardar los cambios al eliminar la clase.');
    }
  }

  async function editClass(classId) {
    const classItem = AppStorage.getData().classes.find((item) => item.id === classId);
    if (!classItem) return;
    const nextName = prompt('Modificar nombre de la clase:', classItem.name);
    if (nextName === null) return;
    const cleanName = nextName.trim();
    if (!cleanName) return alert('El nombre de la clase no puede quedar vacío.');
    classItem.name = cleanName;

    try {
      await AppStorage.persistNow();
      App.render();
    } catch (err) {
      console.error("Error al modificar clase:", err);
      alert('Error al guardar el nuevo nombre de la clase.');
    }
  }

  function renderClassesList() {
    const data = AppStorage.getData();
    const searchInput = byId('searchClass');
    const query = searchInput ? searchInput.value.trim().toLowerCase() : '';

    let filteredClasses = data.classes;
    if (query) {
      filteredClasses = filteredClasses.filter((item) =>
        item.name.toLowerCase().includes(query)
      );
    }

    const cards = filteredClasses.map((classItem) => {
      const maxScore = classItem.activities.reduce((sum, activity) => sum + (Number(activity.maxScore) || 0), 0);
      return `
        <article class="class-card">
          <div>
            <h3>${escapeHtml(classItem.name)}</h3>
            <p class="muted">${classItem.activities.length} actividades · ${formatScore(maxScore)} pts posibles</p>
          </div>
          <div class="toolbar">
            <a class="button" href="clase.html?id=${encodeURIComponent(classItem.id)}">Ingresar</a>
            <button class="secondary" data-edit-class="${classItem.id}">Modificar</button>
            <button class="danger" data-delete-class="${classItem.id}">Eliminar</button>
          </div>
        </article>`;
    }).join('');

    const emptyText = query
      ? `No se encontraron clases que coincidan con "${escapeHtml(query)}".`
      : 'Todavía no hay clases registradas.';

    byId('classesList').innerHTML = cards || `<div class="empty">${emptyText}</div>`;
  }

  function bindEvents() {
    const addBtn = byId('addClass');
    if (addBtn) addBtn.addEventListener('click', addClass);
    const searchInput = byId('searchClass');
    if (searchInput) {
      searchInput.addEventListener('input', renderClassesList);
    }
  }

  return { bindEvents, deleteClass, editClass, renderClassesList };
})();
