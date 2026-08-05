const StudentsModule = (() => {
  const { byId, confirmModal, escapeHtml, uid } = AppUtils;

  function addStudentName(name) {
    const cleanName = name.trim();
    if (!cleanName) return;
    AppStorage.getData().students.push({ id: uid('student'), name: cleanName, createdAt: Date.now() });
  }

  async function addStudent() {
    const input = byId('studentName');
    if (!input.value.trim()) return alert('Escribí el nombre del estudiante.');
    addStudentName(input.value);
    input.value = '';
    await AppStorage.persistNow();
    App.render();
  }

  async function importStudents() {
    const textarea = byId('bulkStudents');
    const names = textarea.value.split('\n').map((line) => line.trim()).filter(Boolean);
    if (!names.length) return alert('Pegá al menos un estudiante.');
    names.forEach(addStudentName);
    textarea.value = '';
    await AppStorage.persistNow();
    App.render();
  }

  async function deleteStudent(studentId) {
    const data = AppStorage.getData();
    const student = data.students.find((item) => item.id === studentId);
    if (!student) return;

    const confirmed = await confirmModal(`¿Eliminar a "${student.name}"? También se eliminarán sus notas.`);
    if (!confirmed) return;

    data.students = data.students.filter((item) => item.id !== studentId);
    Object.keys(data.grades).forEach((key) => {
      if (key.startsWith(`${studentId}:`)) delete data.grades[key];
    });

    // Actualizar UI inmediatamente
    App.render();

    try {
      if (AppStorage.isFirebaseActive()) {
        await AppStorage.deleteStudentFromFirestore(studentId);
      } else {
        await AppStorage.persistNow();
      }
    } catch (err) {
      console.error("Error al eliminar estudiante:", err);
      alert('Error al guardar los cambios al eliminar el estudiante.');
    }
  }

  async function editStudent(studentId) {
    const student = AppStorage.getData().students.find((item) => item.id === studentId);
    if (!student) return;
    const nextName = prompt('Modificar nombre del estudiante:', student.name);
    if (nextName === null) return;
    const cleanName = nextName.trim();
    if (!cleanName) return alert('El nombre del estudiante no puede quedar vacío.');
    student.name = cleanName;
    await AppStorage.persistNow();
    App.render();
  }

  async function clearStudents() {
    const confirmed = await confirmModal('¿Eliminar TODOS los estudiantes y sus notas? Esta acción no se puede deshacer.');
    if (!confirmed) return;
    const data = AppStorage.getData();
    data.students = [];
    data.grades = {};
    App.render();
    try {
      await AppStorage.persistNow();
    } catch (err) {
      console.error("Error al borrar estudiantes:", err);
    }
  }

  function renderStudentsList() {
    let students = [...AppStorage.getData().students];
    const searchInput = byId('searchStudent');
    const sortSelect = byId('sortStudents');

    const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
    const sortOrder = sortSelect ? sortSelect.value : 'default';

    if (query) {
      students = students.filter((student) =>
        student.name.toLowerCase().includes(query)
      );
    }

    if (sortOrder === 'az') {
      students.sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
    } else if (sortOrder === 'za') {
      students.sort((a, b) => b.name.localeCompare(a.name, 'es', { sensitivity: 'base' }));
    }

    if (!students.length) {
      const emptyMsg = query
        ? `No se encontraron estudiantes que coincidan con "${escapeHtml(query)}".`
        : 'Todavía no hay estudiantes registrados.';
      byId('studentsList').innerHTML = `<div class="empty">${emptyMsg}</div>`;
      return;
    }

    const rows = students.map((student, index) => `
      <tr>
        <td>${index + 1}</td>
        <td class="name">${escapeHtml(student.name)}</td>
        <td class="actions">
          <button class="small secondary" data-edit-student="${student.id}">Modificar</button>
          <button class="small danger" data-delete-student="${student.id}">Eliminar</button>
        </td>
      </tr>`).join('');

    byId('studentsList').innerHTML = `
      <div class="table-wrap">
        <table class="compact-table">
          <thead>
            <tr><th>N°</th><th class="name">Nombres y apellidos</th><th>Acciones</th></tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  }

  function bindEvents() {
    const addBtn = byId('addStudent');
    if (addBtn) addBtn.addEventListener('click', addStudent);
    const importBtn = byId('importStudents');
    if (importBtn) importBtn.addEventListener('click', importStudents);
    const clearBtn = byId('clearStudents');
    if (clearBtn) clearBtn.addEventListener('click', clearStudents);

    const searchInput = byId('searchStudent');
    if (searchInput) {
      searchInput.addEventListener('input', renderStudentsList);
    }
    const sortSelect = byId('sortStudents');
    if (sortSelect) {
      sortSelect.addEventListener('change', renderStudentsList);
    }
  }

  return { bindEvents, deleteStudent, editStudent, renderStudentsList };
})();
