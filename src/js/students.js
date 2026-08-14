const StudentsModule = (() => {
  const { byId, escapeHtml, uid } = AppUtils;

  let searchTerm = '';

  function createStudent(name) {
    return { id: uid('student'), name: name.trim() };
  }

  async function saveOrRollback(previousData, errorMessage) {
    try {
      await AppStorage.persistNow();
      App.render();
      return true;
    } catch (error) {
      AppStorage.replaceData(previousData);
      console.error(error);
      alert(error.message || errorMessage);
      return false;
    }
  }

  async function addStudent() {
    const input = byId('studentName');
    if (!input) return;
    const name = input.value.trim();

    if (!name) return alert('Escribe el nombre del estudiante.');

    const previousData = AppStorage.snapshot();
    AppStorage.getData().students.push(createStudent(name));

    if (await saveOrRollback(previousData, 'No se pudo guardar el estudiante.')) {
      input.value = '';
    }
  }

  async function importStudents() {
    const textarea = byId('bulkStudents');
    if (!textarea) return;

    const names = textarea.value
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    if (!names.length) return alert('Pega al menos un estudiante en el cuadro de texto.');

    const previousData = AppStorage.snapshot();
    names.forEach((name) => {
      AppStorage.getData().students.push(createStudent(name));
    });

    if (await saveOrRollback(previousData, 'No se pudo guardar la lista de estudiantes.')) {
      textarea.value = '';
      alert(`Se han agregado ${names.length} estudiante(s) con éxito.`);
    }
  }

  async function deleteStudent(studentId) {
    const data = AppStorage.getData();
    const student = data.students.find((item) => item.id === studentId);

    if (!student || !confirm(`¿Eliminar a "${student.name}"? También se eliminarán todas sus notas asociadas.`)) {
      return;
    }

    const previousData = AppStorage.snapshot();
    data.students = data.students.filter((item) => item.id !== studentId);

    // Remove from grades
    Object.keys(data.grades).forEach((key) => {
      if (key.startsWith(`${studentId}:`)) delete data.grades[key];
    });

    // Remove from diagnosticTests
    if (data.diagnosticTests?.scores?.[studentId]) {
      delete data.diagnosticTests.scores[studentId];
    }

    await saveOrRollback(previousData, 'No se pudo eliminar el estudiante.');
  }

  async function editStudent(studentId) {
    const student = AppStorage.getData().students.find(
      (item) => item.id === studentId
    );

    if (!student) return;

    const nextName = prompt('Modificar nombre y apellidos del estudiante:', student.name);
    if (nextName === null) return;

    const cleanName = nextName.trim();
    if (!cleanName) return alert('El nombre no puede quedar vacío.');

    const previousData = AppStorage.snapshot();
    student.name = cleanName;
    await saveOrRollback(previousData, 'No se pudo modificar el estudiante.');
  }

  async function clearStudents() {
    const total = AppStorage.getData().students.length;
    if (!total) return alert('No hay estudiantes registrados para eliminar.');

    if (!confirm(`¿Eliminar TODOS los ${total} estudiantes y sus calificaciones registradas? Esta acción no se puede deshacer.`)) {
      return;
    }

    const previousData = AppStorage.snapshot();
    const data = AppStorage.getData();
    data.students = [];
    data.grades = {};
    if (data.diagnosticTests?.scores) {
      data.diagnosticTests.scores = {};
    }

    await saveOrRollback(previousData, 'No se pudieron eliminar los estudiantes.');
  }

  function renderStudentsList() {
    const students = AppStorage.getData().students;
    const container = byId('studentsList');
    if (!container) return;

    const totalCountEl = byId('totalStudentsCount');
    if (totalCountEl) totalCountEl.textContent = students.length;

    if (!students.length) {
      container.innerHTML =
        '<div class="empty">Todavía no hay estudiantes registrados en el sistema.</div>';
      return;
    }

    const filtered = searchTerm
      ? students.filter((s) => s.name.toLowerCase().includes(searchTerm.toLowerCase()))
      : students;

    if (!filtered.length) {
      container.innerHTML =
        `<div class="empty">No se encontraron estudiantes que coincidan con "${escapeHtml(searchTerm)}".</div>`;
      return;
    }

    const rows = filtered
      .map(
        (student, index) => `
          <tr>
            <td>${index + 1}</td>
            <td class="name">${escapeHtml(student.name)}</td>
            <td class="actions">
              <button class="btn btn-secondary btn-sm" data-edit-student="${student.id}">Editar</button>
              <button class="btn btn-danger btn-sm" data-delete-student="${student.id}">Eliminar</button>
            </td>
          </tr>`
      )
      .join('');

    container.innerHTML = `
      <div class="table-wrap">
        <table class="compact-table">
          <thead>
            <tr>
              <th style="width: 60px;">N.º</th>
              <th class="name">Nombres y Apellidos</th>
              <th style="width: 170px;">Acciones</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  }

  function bindEvents() {
    byId('addStudent')?.addEventListener('click', addStudent);
    byId('importStudents')?.addEventListener('click', importStudents);
    byId('clearStudents')?.addEventListener('click', clearStudents);

    byId('studentSearch')?.addEventListener('input', (e) => {
      searchTerm = e.target.value.trim();
      renderStudentsList();
    });
  }

  return { bindEvents, deleteStudent, editStudent, renderStudentsList };
})();
