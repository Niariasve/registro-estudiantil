const ClassesModule = (() => {
  const { byId, escapeHtml, formatScore, uid } = AppUtils;

  const colorPalette = [
    '#2e7d32', '#00695c', '#0277bd', '#283593', '#6a1b9a', '#ad1457', '#d84315', '#4e342e', '#37474f'
  ];

  let selectedColor = colorPalette[0];

  function classNameExists(name, ignoredId = null) {
    const normalizedName = name.trim().toLocaleLowerCase('es');

    return AppStorage.getData().classes.some(
      (item) =>
        item.id !== ignoredId &&
        item.name.trim().toLocaleLowerCase('es') === normalizedName
    );
  }

  function openClassModal(classIdToEdit = null) {
    const modal = byId('classModal');
    const titleEl = byId('classModalTitle');
    const nameInput = byId('modalClassName');
    const codeInput = byId('modalClassCode');
    const termInput = byId('modalClassTerm');
    const idInput = byId('modalClassId');
    const swatchesContainer = byId('modalColorSwatches');

    if (classIdToEdit) {
      const classItem = AppStorage.getData().classes.find((c) => c.id === classIdToEdit);
      if (!classItem) return;
      titleEl.textContent = 'Editar clase';
      idInput.value = classItem.id;
      nameInput.value = classItem.name;
      codeInput.value = classItem.code || '';
      termInput.value = classItem.term || 'I PAO 2026';
      selectedColor = classItem.color || colorPalette[0];
    } else {
      titleEl.textContent = 'Nueva clase';
      idInput.value = '';
      nameInput.value = '';
      codeInput.value = '';
      termInput.value = 'I PAO 2026';
      selectedColor = colorPalette[Math.floor(Math.random() * colorPalette.length)];
    }

    // Render swatches
    swatchesContainer.innerHTML = colorPalette
      .map(
        (c) => `<button type="button" class="color-swatch ${c === selectedColor ? 'selected' : ''}" style="background-color: ${c};" data-color="${c}"></button>`
      )
      .join('');

    modal.classList.add('open');
    nameInput.focus();
  }

  function closeClassModal() {
    byId('classModal')?.classList.remove('open');
  }

  async function saveClassFromModal() {
    const id = byId('modalClassId').value.trim();
    const name = byId('modalClassName').value.trim();
    const code = byId('modalClassCode').value.trim() || 'PARALELO 1';
    const term = byId('modalClassTerm').value.trim() || 'I PAO 2026';

    if (!name) return alert('Por favor escribe el nombre de la clase.');
    if (classNameExists(name, id || null)) {
      return alert('Ya existe una clase con ese nombre.');
    }

    const previousData = AppStorage.snapshot();
    const data = AppStorage.getData();

    if (id) {
      // Edit
      const classItem = data.classes.find((c) => c.id === id);
      if (classItem) {
        classItem.name = name;
        classItem.code = code;
        classItem.term = term;
        classItem.color = selectedColor;
      }
    } else {
      // Add
      const newClass = {
        id: uid('class'),
        name,
        code,
        term,
        color: selectedColor,
        activities: []
      };
      data.classes.push(newClass);
      data.selectedClassId = newClass.id;
    }

    try {
      await AppStorage.persistNow();
      closeClassModal();
      App.render();
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
        `¿Eliminar la clase "${classItem.name}"? También se eliminarán sus actividades y notas asociadas.`
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

  function renderClassesList() {
    const data = AppStorage.getData();
    const container = byId('classesList');
    if (!container) return;

    if (!data.classes.length) {
      container.innerHTML = `
        <div class="empty" style="grid-column: 1 / -1; background: #fff; border: 1px dashed #cbd5e1; border-radius: 12px; padding: 40px 20px;">
          <p style="font-size: 16px; font-weight: 700; color: #1e293b; margin-bottom: 8px;">No tienes clases creadas todavía</p>
          <p class="muted" style="margin-bottom: 16px;">Comienza creando tu primera materia o paralelo para registrar actividades y notas.</p>
          <button class="btn btn-primary" id="emptyAddClassBtn">+ Crear primera clase</button>
        </div>`;
      byId('emptyAddClassBtn')?.addEventListener('click', () => openClassModal());
      return;
    }

    const totalStudents = data.students.length;

    const cards = data.classes
      .map((classItem) => {
        const maxScore = classItem.activities.reduce(
          (sum, activity) => sum + (Number(activity.maxScore) || 0),
          0
        );

        const cardColor = classItem.color || '#2e7d32';

        return `
          <article class="course-card" data-open-class="${classItem.id}">
            <div class="course-card-banner" style="background-color: ${cardColor};">
              <button class="card-menu-btn" title="Opciones de clase" data-menu-class="${classItem.id}" onclick="event.stopPropagation();">
                ⋮
              </button>
            </div>
            <div class="course-card-content">
              <h3 class="course-title" title="${escapeHtml(classItem.name)}">${escapeHtml(classItem.name)}</h3>
              <p class="course-code">${escapeHtml(classItem.code || 'PARALELO 1')}</p>
              <p class="course-term">${escapeHtml(classItem.term || 'I PAO 2026')}</p>
            </div>
            <div class="course-card-footer">
              <span class="badge badge-primary">${classItem.activities.length} actividades</span>
              <span>${formatScore(maxScore)} pts</span>
              <span>${totalStudents} est.</span>
            </div>
          </article>`;
      })
      .join('');

    container.innerHTML = cards;
  }

  function bindEvents() {
    byId('openAddClassBtn')?.addEventListener('click', () => openClassModal());
    byId('closeClassModalBtn')?.addEventListener('click', closeClassModal);
    byId('cancelClassModalBtn')?.addEventListener('click', closeClassModal);
    byId('saveClassModalBtn')?.addEventListener('click', saveClassFromModal);

    byId('modalColorSwatches')?.addEventListener('click', (e) => {
      const swatch = e.target.closest('[data-color]');
      if (!swatch) return;
      selectedColor = swatch.dataset.color;
      document.querySelectorAll('#modalColorSwatches .color-swatch').forEach((s) => {
        s.classList.toggle('selected', s.dataset.color === selectedColor);
      });
    });

    // Close modal on clicking outside
    byId('classModal')?.addEventListener('click', (e) => {
      if (e.target === byId('classModal')) closeClassModal();
    });
  }

  return {
    bindEvents,
    deleteClass,
    editClass: openClassModal,
    openClassModal,
    renderClassesList
  };
})();
