const StudentsModule = (() => {
  const { byId, escapeHtml, uid } = AppUtils;

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
    const names = textarea.value
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    if (!names.length) return alert('Pega al menos un estudiante.');

    const previousData = AppStorage.snapshot();
    names.forEach((name) => {
      AppStorage.getData().students.push(createStudent(name));
    });

    if (await saveOrRollback(previousData, 'No se pudo guardar la lista.')) {
      textarea.value = '';
      alert(`${names.length} estudiante(s) registrado(s).`);
    }
  }

  async function deleteStudent(studentId) {
    const data = AppStorage.getData();
    const student = data.students.find((item) => item.id === studentId);

    if (!student || !confirm(`¿Eliminar a ${student.name}? También se eliminarán sus notas.`)) {
      return;
    }

    const previousData = AppStorage.snapshot();
    data.students = data.students.filter((item) => item.id !== studentId);

    Object.keys(data.grades).forEach((key) => {
      if (key.startsWith(`${studentId}:`)) delete data.grades[key];
    });

    await saveOrRollback(previousData, 'No se pudo eliminar el estudiante.');
  }

  async function editStudent(studentId) {
    const student = AppStorage.getData().students.find(
      (item) => item.id === studentId
    );

    if (!student) return;

    const nextName = prompt('Modificar nombre del estudiante:', student.name);
    if (nextName === null) return;

    const cleanName = nextName.trim();
    if (!cleanName) return alert('El nombre no puede quedar vacío.');

    const previousData = AppStorage.snapshot();
    student.name = cleanName;
    await saveOrRollback(previousData, 'No se pudo modificar el estudiante.');
  }

  async function clearStudents() {
    if (!confirm('¿Eliminar todos los estudiantes y sus notas?')) return;

    const previousData = AppStorage.snapshot();
    const data = AppStorage.getData();
    data.students = [];
    data.grades = {};

    await saveOrRollback(previousData, 'No se pudieron eliminar los estudiantes.');
  }

  function renderStudentsList() {
    const students = AppStorage.getData().students;

    if (!students.length) {
      byId('studentsList').innerHTML =
        '<div class="empty">Todavía no hay estudiantes registrados.</div>';
      return;
    }

    const rows = students
      .map(
        (student, index) => `
          <tr>
            <td>${index + 1}</td>
            <td class="name">${escapeHtml(student.name)}</td>
            <td class="actions">
              <button class="small secondary" data-edit-student="${student.id}">Modificar</button>
              <button class="small danger" data-delete-student="${student.id}">Eliminar</button>
            </td>
          </tr>`
      )
      .join('');

    byId('studentsList').innerHTML = `
      <div class="table-wrap">
        <table class="compact-table">
          <thead>
            <tr><th>N.º</th><th class="name">Nombres y apellidos</th><th>Acciones</th></tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  }

  function bindEvents() {
    byId('addStudent').addEventListener('click', addStudent);
    byId('importStudents').addEventListener('click', importStudents);
    byId('clearStudents').addEventListener('click', clearStudents);
  }

  return { bindEvents, deleteStudent, editStudent, renderStudentsList };
})();
