const App = (() => {
  const { byId } = AppUtils;

  function currentPage() {
    return document.body.dataset.page;
  }

  function showHome() {
    window.location.href = 'index.html';
  }

  function showDashboard() {
    window.location.href = 'dashboard.html';
  }

  function showClass(classId) {
    AppStorage.setSelectedClass(classId);
    window.location.href = `clase.html?id=${encodeURIComponent(classId)}`;
  }

  function render() {
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
    if (currentPage() === 'home') {
      StudentsModule.bindEvents();
      ClassesModule.bindEvents();
      BackupModule.bindEvents();
    }

    if (currentPage() === 'class-detail') {
      byId('backToHome')?.addEventListener('click', showHome);
      byId('goToDashboard')?.addEventListener('click', showDashboard);
      ClassDetailModule.bindEvents();
    }

    if (currentPage() === 'dashboard') {
      byId('backToHome')?.addEventListener('click', showHome);
      DashboardModule.bindEvents();
    }

    document.addEventListener('change', (event) => {
      if (event.target.matches('[data-grade]')) {
        ClassDetailModule.updateGrade(event.target);
      }
    });

    document.addEventListener('click', (event) => {
      const openClassId = event.target.dataset.openClass;
      const deleteClassId = event.target.dataset.deleteClass;
      const editClassId = event.target.dataset.editClass;
      const deleteStudentId = event.target.dataset.deleteStudent;
      const editStudentId = event.target.dataset.editStudent;
      const deleteActivityId = event.target.dataset.deleteActivity;
      const editActivityId = event.target.dataset.editActivity;

      if (openClassId) showClass(openClassId);
      if (editClassId) ClassesModule.editClass(editClassId);
      if (deleteClassId) ClassesModule.deleteClass(deleteClassId);
      if (editStudentId) StudentsModule.editStudent(editStudentId);
      if (deleteStudentId) StudentsModule.deleteStudent(deleteStudentId);
      if (editActivityId) ClassDetailModule.editActivity(editActivityId);
      if (deleteActivityId) ClassDetailModule.deleteActivity(deleteActivityId);
    });
  }

  return { init, render, showClass, showDashboard, showHome };
})();

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
