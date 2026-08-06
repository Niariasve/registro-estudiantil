const ClassesModule = (() => {
  const { byId, escapeHtml, formatScore, uid } = AppUtils;

  function classNameExists(name, ignoredId = null) {
    const normalizedName = name.trim().toLocaleLowerCase('es');

    return AppStorage.getData().classes.some(
      (item) =>
        item.id !== ignoredId &&
        item.name.trim().toLocaleLowerCase('es') === normalizedName
    );
  }

  async function addClass() {
    const input = byId('className');
    const name = input.value.trim();

    if (!name) return alert('Escribe el nombre de la clase.');
    if (classNameExists(name)) return alert('Ya existe una clase con ese nombre.');

    const previousData = AppStorage.snapshot();
    const classItem = { id: uid('class'), name, activities: [] };
    const data = AppStorage.getData();

    data.classes.push(classItem);
    data.selectedClassId = classItem.id;

    try {
      await AppStorage.persistNow();
      input.value = '';
      App.showClass(classItem.id);
    } catch (error) {
      AppStorage.replaceData(previousData);
      console.error(error);
      alert(error.message || 'No se pudo guardar la clase.');
    }
  }

  async function deleteClass(classId) {
    const data = AppStorage.getData();
    const classItem = data.classes.find((item) => item.id === classId);

    if (!classItem) return;
    if (
      !confirm(
        `¿Eliminar ${classItem.name}? También se eliminarán sus actividades y notas.`
      )
    ) {
      return;
    }

    const previousData = AppStorage.snapshot();
    const activityIds = new Set(
      classItem.activities.map((activity) => activity.id)
    );

    Object.keys(data.grades).forEach((key) => {
      const activityId = key.slice(key.indexOf(':') + 1);
      if (activityIds.has(activityId)) delete data.grades[key];
    });

    data.classes = data.classes.filter((item) => item.id !== classId);

    if (data.selectedClassId === classId) {
      data.selectedClassId = data.classes[0]?.id ?? null;
    }

    try {
      await AppStorage.persistNow();
      App.render();
    } catch (error) {
      AppStorage.replaceData(previousData);
      console.error(error);
      alert(error.message || 'No se pudo eliminar la clase.');
    }
  }

  async function editClass(classId) {
    const classItem = AppStorage.getData().classes.find(
      (item) => item.id === classId
    );

    if (!classItem) return;

    const nextName = prompt('Modificar nombre de la clase:', classItem.name);
    if (nextName === null) return;

    const cleanName = nextName.trim();
    if (!cleanName) return alert('El nombre no puede quedar vacío.');
    if (classNameExists(cleanName, classId)) {
      return alert('Ya existe otra clase con ese nombre.');
    }

    const previousData = AppStorage.snapshot();
    classItem.name = cleanName;

    try {
      await AppStorage.persistNow();
      App.render();
    } catch (error) {
      AppStorage.replaceData(previousData);
      console.error(error);
      alert(error.message || 'No se pudo modificar la clase.');
    }
  }

  function renderClassesList() {
    const data = AppStorage.getData();

    const cards = data.classes
      .map((classItem) => {
        const maxScore = classItem.activities.reduce(
          (sum, activity) => sum + (Number(activity.maxScore) || 0),
          0
        );

        return `
          <article class="class-card">
            <div>
              <h3>${escapeHtml(classItem.name)}</h3>
              <p class="muted">${classItem.activities.length} actividades · ${formatScore(maxScore)} pts posibles</p>
            </div>
            <div class="toolbar">
              <button data-open-class="${classItem.id}">Ingresar</button>
              <button class="secondary" data-edit-class="${classItem.id}">Modificar</button>
              <button class="danger" data-delete-class="${classItem.id}">Eliminar</button>
            </div>
          </article>`;
      })
      .join('');

    byId('classesList').innerHTML =
      cards || '<div class="empty">Todavía no hay clases registradas.</div>';
  }

  function bindEvents() {
    byId('addClass').addEventListener('click', addClass);
  }

  return { bindEvents, deleteClass, editClass, renderClassesList };
})();
