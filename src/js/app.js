const App = (() => {
  const { byId } = AppUtils;

  function currentPage() {
    return document.body.dataset.page;
  }

  function showHome() {
    window.location.href = 'index.html';
  }

  function showClass(classId) {
    AppStorage.setSelectedClass(classId);
    window.location.href = `clase.html?id=${encodeURIComponent(classId)}`;
  }

  function render() {
    // IMPORTANTE: NO llamar AppStorage.save() aquí — crearía bucle infinito con Firestore
    if (currentPage() === 'home') {
      StudentsModule.renderStudentsList();
      ClassesModule.renderClassesList();
    }
    if (currentPage() === 'class-detail') {
      ClassDetailModule.renderClassDetail();
    }
    if (currentPage() === 'dashboard') {
      DashboardModule.renderDashboard();
    }
  }

  function restoreRoute() {
    if (currentPage() !== 'class-detail') return;
    const params = new URLSearchParams(window.location.search);
    const classId = params.get('id');
    if (classId && AppStorage.getData().classes.some((item) => item.id === classId)) {
      AppStorage.setSelectedClass(classId);
    } else {
      showHome();
    }
  }

  async function init() {
    await AppStorage.init();
    bindEvents();
    restoreRoute();
    render();
  }

  function bindEvents() {
    if (currentPage() === 'home') {
      StudentsModule.bindEvents();
      ClassesModule.bindEvents();
      BackupModule.bindEvents();
    }

    if (currentPage() === 'class-detail') {
      byId('backToHome').addEventListener('click', showHome);
      ClassDetailModule.bindEvents();
    }

    if (currentPage() === 'dashboard') {
      byId('backToHome').addEventListener('click', showHome);
      DashboardModule.bindEvents();
    }

    document.addEventListener('change', (event) => {
      if (event.target.matches('[data-grade]')) ClassDetailModule.updateGrade(event.target);
    });

    document.addEventListener('click', (event) => {
      const openClassBtn = event.target.closest('[data-open-class]');
      const deleteClassBtn = event.target.closest('[data-delete-class]');
      const editClassBtn = event.target.closest('[data-edit-class]');
      const deleteStudentBtn = event.target.closest('[data-delete-student]');
      const editStudentBtn = event.target.closest('[data-edit-student]');
      const deleteActivityBtn = event.target.closest('[data-delete-activity]');
      const editActivityBtn = event.target.closest('[data-edit-activity]');

      if (openClassBtn) showClass(openClassBtn.dataset.openClass);
      if (editClassBtn) ClassesModule.editClass(editClassBtn.dataset.editClass);
      if (deleteClassBtn) ClassesModule.deleteClass(deleteClassBtn.dataset.deleteClass);
      if (editStudentBtn) StudentsModule.editStudent(editStudentBtn.dataset.editStudent);
      if (deleteStudentBtn) StudentsModule.deleteStudent(deleteStudentBtn.dataset.deleteStudent);
      if (editActivityBtn) ClassDetailModule.editActivity(editActivityBtn.dataset.editActivity);
      if (deleteActivityBtn) ClassDetailModule.deleteActivity(deleteActivityBtn.dataset.deleteActivity);
    });
  }

  return { init, render, showClass, showHome };
})();

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
