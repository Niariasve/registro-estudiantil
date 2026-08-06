const ClassesModule = (() => {
  const { byId, escapeHtml, formatScore, uid } = AppUtils;

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
    } catch {
      data.classes = data.classes.filter((item) => item.id !== classItem.id);
      data.selectedClassId = previousSelectedClassId;
      alert('No se pudo guardar la clase en la base de datos local.');
    }
  }

  function deleteClass(classId) {
    const data = AppStorage.getData();
    if (data.classes.length === 1) return alert('Debe existir al menos una clase.');
    const classItem = data.classes.find((item) => item.id === classId);
    if (!classItem || !confirm(`¿Eliminar ${classItem.name}? También se eliminarán sus actividades y notas.`)) return;
    const activityIds = classItem.activities.map((activity) => activity.id);
    Object.keys(data.grades).forEach((key) => {
      if (activityIds.some((activityId) => key.endsWith(`:${activityId}`))) delete data.grades[key];
    });
    data.classes = data.classes.filter((item) => item.id !== classId);
    data.selectedClassId = data.classes[0].id;
    App.render();
    App.showHome();
  }

  function editClass(classId) {
    const classItem = AppStorage.getData().classes.find((item) => item.id === classId);
    if (!classItem) return;
    const nextName = prompt('Modificar nombre de la clase:', classItem.name);
    if (nextName === null) return;
    const cleanName = nextName.trim();
    if (!cleanName) return alert('El nombre de la clase no puede quedar vacío.');
    classItem.name = cleanName;
    App.render();
  }

  function renderClassesList() {
    const data = AppStorage.getData();
    const cards = data.classes.map((classItem) => {
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

    byId('classesList').innerHTML = cards || '<div class="empty">Todavía no hay clases registradas.</div>';
  }

  function bindEvents() {
    byId('addClass').addEventListener('click', addClass);
  }

  return { bindEvents, deleteClass, editClass, renderClassesList };
})();
