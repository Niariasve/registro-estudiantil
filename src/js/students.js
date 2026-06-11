const StudentsModule = (() => {
  const { byId, escapeHtml, uid } = AppUtils;

  function addStudentName(name) {
    const cleanName = name.trim();
    if (!cleanName) return;
    AppStorage.getData().students.push({ id: uid('student'), name: cleanName });
  }

  function addStudent() {
    const input = byId('studentName');
    if (!input.value.trim()) return alert('Escribí el nombre del estudiante.');
    addStudentName(input.value);
    input.value = '';
    App.render();
  }

  function importStudents() {
    const textarea = byId('bulkStudents');
    const names = textarea.value.split('\n').map((line) => line.trim()).filter(Boolean);
    if (!names.length) return alert('Pegá al menos un estudiante.');
    names.forEach(addStudentName);
    textarea.value = '';
    App.render();
  }

  function deleteStudent(studentId) {
    const data = AppStorage.getData();
    const student = data.students.find((item) => item.id === studentId);
    if (!student || !confirm(`¿Eliminar a ${student.name}? También se eliminarán sus notas.`)) return;
    data.students = data.students.filter((item) => item.id !== studentId);
    Object.keys(data.grades).forEach((key) => {
      if (key.startsWith(`${studentId}:`)) delete data.grades[key];
    });
    App.render();
  }

  function editStudent(studentId) {
    const student = AppStorage.getData().students.find((item) => item.id === studentId);
    if (!student) return;
    const nextName = prompt('Modificar nombre del estudiante:', student.name);
    if (nextName === null) return;
    const cleanName = nextName.trim();
    if (!cleanName) return alert('El nombre del estudiante no puede quedar vacío.');
    student.name = cleanName;
    App.render();
  }

  function clearStudents() {
    if (!confirm('¿Eliminar todos los estudiantes y sus notas?')) return;
    const data = AppStorage.getData();
    data.students = [];
    data.grades = {};
    App.render();
  }

  function renderStudentsList() {
    const students = AppStorage.getData().students;
    if (!students.length) {
      byId('studentsList').innerHTML = '<div class="empty">Todavía no hay estudiantes registrados.</div>';
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
    byId('addStudent').addEventListener('click', addStudent);
    byId('importStudents').addEventListener('click', importStudents);
    byId('clearStudents').addEventListener('click', clearStudents);
  }

  return { bindEvents, deleteStudent, editStudent, renderStudentsList };
})();
