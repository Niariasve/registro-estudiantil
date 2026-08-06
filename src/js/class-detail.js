const ClassDetailModule = (() => {
  const {
    byId,
    downloadFile,
    escapeHtml,
    formatScore,
    normalizeScore,
    toCsv,
    uid
  } = AppUtils;

  function gradeKey(studentId, activityId) {
    return `${studentId}:${activityId}`;
  }

  async function persistChange(previousData, errorMessage) {
    try {
      await AppStorage.persistNow();
      App.render();
      return true;
    } catch (error) {
      AppStorage.replaceData(previousData);
      console.error(error);
      alert(error.message || errorMessage);
      App.render();
      return false;
    }
  }

  async function addActivity() {
    const currentClass = AppStorage.selectedClass();
    if (!currentClass) return;

    const nameInput = byId('activityName');
    const scoreInput = byId('activityMax');
    const name = nameInput.value.trim();
    const maxScore = normalizeScore(scoreInput.value);

    if (!name) return alert('Escribe el nombre de la actividad.');
    if (maxScore === '') return alert('Escribe un puntaje máximo válido.');

    const previousData = AppStorage.snapshot();
    currentClass.activities.push({ id: uid('activity'), name, maxScore });

    if (await persistChange(previousData, 'No se pudo guardar la actividad.')) {
      nameInput.value = '';
      scoreInput.value = '';
    }
  }

  async function deleteActivity(activityId) {
    const currentClass = AppStorage.selectedClass();
    if (!currentClass) return;

    const activity = currentClass.activities.find((item) => item.id === activityId);
    if (!activity || !confirm(`¿Eliminar ${activity.name}? También se eliminarán sus notas.`)) {
      return;
    }

    const previousData = AppStorage.snapshot();
    currentClass.activities = currentClass.activities.filter(
      (item) => item.id !== activityId
    );

    Object.keys(AppStorage.getData().grades).forEach((key) => {
      if (key.endsWith(`:${activityId}`)) {
        delete AppStorage.getData().grades[key];
      }
    });

    await persistChange(previousData, 'No se pudo eliminar la actividad.');
  }

  async function editActivity(activityId) {
    const currentClass = AppStorage.selectedClass();
    if (!currentClass) return;

    const activity = currentClass.activities.find((item) => item.id === activityId);
    if (!activity) return;

    const nextName = prompt('Modificar nombre de la actividad:', activity.name);
    if (nextName === null) return;

    const cleanName = nextName.trim();
    if (!cleanName) return alert('El nombre no puede quedar vacío.');

    const nextMaxScore = prompt(
      'Modificar puntaje máximo:',
      formatScore(activity.maxScore)
    );
    if (nextMaxScore === null) return;

    const cleanMaxScore = normalizeScore(nextMaxScore);
    if (cleanMaxScore === '') return alert('El puntaje máximo debe ser válido.');

    const previousData = AppStorage.snapshot();
    activity.name = cleanName;
    activity.maxScore = cleanMaxScore;
    trimGradesAboveMax(activity.id, cleanMaxScore);

    await persistChange(previousData, 'No se pudo modificar la actividad.');
  }

  function trimGradesAboveMax(activityId, maxScore) {
    Object.entries(AppStorage.getData().grades).forEach(([key, value]) => {
      if (key.endsWith(`:${activityId}`) && Number(value) > Number(maxScore)) {
        AppStorage.getData().grades[key] = Number(maxScore);
      }
    });
  }

  function renderClassDetail() {
    const currentClass = AppStorage.selectedClass();
    if (!currentClass) {
      App.showHome();
      return;
    }

    byId('classTitle').textContent = currentClass.name;
    byId('classSubtitle').textContent = `${AppStorage.getData().students.length} estudiantes · ${currentClass.activities.length} actividades`;
    renderActivitiesInfo(currentClass);
    renderGradesTable(currentClass);
  }

  function renderActivitiesInfo(currentClass) {
    if (!currentClass.activities.length) {
      byId('activitiesList').innerHTML =
        '<div class="empty">Todavía no hay actividades para esta clase.</div>';
      return;
    }

    const rows = currentClass.activities
      .map(
        (activity, index) => `
          <tr>
            <td>${index + 1}</td>
            <td class="name">${escapeHtml(activity.name)}</td>
            <td>${formatScore(activity.maxScore)}</td>
            <td class="actions">
              <button class="small secondary" data-edit-activity="${activity.id}">Modificar</button>
              <button class="small danger" data-delete-activity="${activity.id}">Eliminar</button>
            </td>
          </tr>`
      )
      .join('');

    byId('activitiesList').innerHTML = `
      <div class="table-wrap">
        <table class="compact-table">
          <thead>
            <tr><th>N.º</th><th class="name">Actividad/Pregunta</th><th>Puntaje máximo</th><th>Acciones</th></tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  }

  function renderGradesTable(currentClass) {
    const students = AppStorage.getData().students;

    if (!students.length) {
      byId('gradesTable').innerHTML =
        '<div class="empty">Primero registra estudiantes desde la página principal.</div>';
      return;
    }

    const activityHeaders = currentClass.activities
      .map(
        (activity) => `
          <th>${escapeHtml(activity.name)}<br /><span class="muted">${formatScore(activity.maxScore)} pts</span></th>`
      )
      .join('');

    const rows = students
      .map((student, index) => {
        const cells = currentClass.activities
          .map((activity) => {
            const key = gradeKey(student.id, activity.id);
            return `<td><input type="number" min="0" step="0.1" data-grade="${key}" data-max="${activity.maxScore}" value="${formatScore(AppStorage.getData().grades[key])}" /></td>`;
          })
          .join('');

        const total = currentClass.activities.reduce((sum, activity) => {
          const value = AppStorage.getData().grades[
            gradeKey(student.id, activity.id)
          ];
          return sum + (Number(value) || 0);
        }, 0);

        return `
          <tr>
            <td>${index + 1}</td>
            <td class="name">${escapeHtml(student.name)}</td>
            ${cells || '<td class="muted">Sin actividades</td>'}
            <td class="total">${formatScore(total)}</td>
          </tr>`;
      })
      .join('');

    const activitiesColspan = Math.max(currentClass.activities.length, 1);
    byId('gradesTable').innerHTML = `
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th class="group">N.º</th>
              <th class="group name">Estudiante</th>
              <th class="group" colspan="${activitiesColspan}">${escapeHtml(currentClass.name)}</th>
              <th class="group">Total</th>
            </tr>
            <tr>
              <th>N.º</th>
              <th class="name">Nombres y apellidos</th>
              ${activityHeaders || '<th>Sin actividades registradas</th>'}
              <th>Total</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  }

  async function updateGrade(input) {
    const previousData = AppStorage.snapshot();
    const value = normalizeScore(input.value);
    const max = Number(input.dataset.max);

    if (value === '') {
      delete AppStorage.getData().grades[input.dataset.grade];
    } else {
      AppStorage.getData().grades[input.dataset.grade] = Math.min(value, max);
    }

    await persistChange(previousData, 'No se pudo guardar la calificación.');
  }

  function exportCsv() {
    const currentClass = AppStorage.selectedClass();
    if (!currentClass) return;

    const headers = [
      'N.º',
      'Nombres y apellidos',
      ...currentClass.activities.map(
        (item) => `${item.name} (${item.maxScore} pts)`
      ),
      'Total'
    ];

    const rows = AppStorage.getData().students.map((student, index) => {
      const scores = currentClass.activities.map(
        (activity) =>
          AppStorage.getData().grades[gradeKey(student.id, activity.id)] ?? ''
      );
      const total = scores.reduce(
        (sum, value) => sum + (Number(value) || 0),
        0
      );

      return [
        index + 1,
        student.name,
        ...scores.map(formatScore),
        formatScore(total)
      ];
    });

    downloadFile(
      `${currentClass.name}.csv`,
      `\ufeff${toCsv([headers, ...rows])}`,
      'text/csv;charset=utf-8'
    );
  }

  function bindEvents() {
    byId('addActivity').addEventListener('click', addActivity);
    byId('exportCsv').addEventListener('click', exportCsv);
  }

  return {
    bindEvents,
    deleteActivity,
    editActivity,
    renderClassDetail,
    updateGrade
  };
})();
