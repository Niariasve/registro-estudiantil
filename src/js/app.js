const App = (() => {
  const { byId } = AppUtils;

  function currentPage() {
    return document.body.dataset.page;
  }

  function showHome() {
    window.location.href = '/paginas/index.html';
  }

  function showStudents() {
    window.location.href = '/paginas/estudiantes.html';
  }

  function showDashboard() {
    window.location.href = '/paginas/dashboard.html';
  }

  function showClass(classId) {
    AppStorage.setSelectedClass(classId);
    window.location.href = `/paginas/clase.html?id=${encodeURIComponent(classId)}`;
  }

  function render() {
    const page = currentPage();

    if (page === 'home') {
      ClassesModule.renderClassesList();
    }

    if (page === 'students') {
      StudentsModule.renderStudentsList();
    }

    if (page === 'class-detail') {
      ClassDetailModule.renderClassDetail();
    }

    if (page === 'dashboard') {
      DashboardModule.renderDashboard();
    }
  }

  function restoreRoute() {
    if (currentPage() !== 'class-detail') return;

    const params = new URLSearchParams(window.location.search);
    const classId = params.get('id');
    const classExists = AppStorage.getData().classes.some(
      (item) => item.id === classId
    );

    if (!classId || !classExists) {
      showHome();
      return;
    }

    AppStorage.setSelectedClass(classId);
  }

  async function init() {
    await AppStorage.init();
    restoreRoute();
    bindEvents();
    render();
  }

  function bindEvents() {
    const page = currentPage();

    if (page === 'home') {
      ClassesModule.bindEvents();
    }

    if (page === 'students') {
      StudentsModule.bindEvents();
      BackupModule.bindEvents();
    }

    if (page === 'class-detail') {
      ClassDetailModule.bindEvents();
    }

    if (page === 'dashboard') {
      DashboardModule.bindEvents();
    }

    document.addEventListener('change', (event) => {
      if (event.target.matches('[data-grade]')) {
        ClassDetailModule.updateGrade(event.target);
      }
    });

    document.addEventListener('click', (event) => {
      const toggleMenuBtn = event.target.closest('[data-toggle-menu]');
      if (toggleMenuBtn) {
        event.stopPropagation();
        ClassesModule.toggleDropdown(toggleMenuBtn.dataset.toggleMenu);
        return;
      }

      const editClassBtn = event.target.closest('[data-edit-class]');
      if (editClassBtn) {
        event.stopPropagation();
        ClassesModule.editClass(editClassBtn.dataset.editClass);
        return;
      }

      const deleteClassBtn = event.target.closest('[data-delete-class]');
      if (deleteClassBtn) {
        event.stopPropagation();
        ClassesModule.deleteClass(deleteClassBtn.dataset.deleteClass);
        return;
      }

      const openCard = event.target.closest('[data-open-class]');
      if (openCard) {
        showClass(openCard.dataset.openClass);
        return;
      }

      const deleteStudentBtn = event.target.closest('[data-delete-student]');
      const editStudentBtn = event.target.closest('[data-edit-student]');
      const deleteActivityBtn = event.target.closest('[data-delete-activity]');
      const editActivityBtn = event.target.closest('[data-edit-activity]');

      if (editStudentBtn) StudentsModule.editStudent(editStudentBtn.dataset.editStudent);
      if (deleteStudentBtn) StudentsModule.deleteStudent(deleteStudentBtn.dataset.deleteStudent);
      if (editActivityBtn) ClassDetailModule.editActivity(editActivityBtn.dataset.editActivity);
      if (deleteActivityBtn) ClassDetailModule.deleteActivity(deleteActivityBtn.dataset.deleteActivity);
    });
  }

  return { init, render, showClass, showDashboard, showHome, showStudents };
})();

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

