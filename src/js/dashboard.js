const DashboardModule = (() => {
  const { byId, downloadFile, escapeHtml, formatScore, toCsv } = AppUtils;

  let classChart = null;
  let distributionChart = null;

  function hasGrade(value) {
    return value !== undefined && value !== null && value !== '';
  }

  function calculateMetrics() {
    const data = AppStorage.getData();
    const allActivities = data.classes.flatMap((classItem) =>
      classItem.activities.map((activity) => ({
        ...activity,
        classId: classItem.id,
        className: classItem.name
      }))
    );

    const expectedGrades = data.students.length * allActivities.length;
    let enteredGrades = 0;
    let obtainedPoints = 0;
    let evaluatedMaximum = 0;

    const classMetrics = data.classes.map((classItem) => {
      let classEntered = 0;
      let classObtained = 0;
      let classMaximum = 0;

      data.students.forEach((student) => {
        classItem.activities.forEach((activity) => {
          const value = data.grades[`${student.id}:${activity.id}`];
          if (!hasGrade(value)) return;

          classEntered += 1;
          classObtained += Number(value);
          classMaximum += Number(activity.maxScore);
        });
      });

      const expected = data.students.length * classItem.activities.length;

      return {
        id: classItem.id,
        name: classItem.name,
        activities: classItem.activities.length,
        enteredGrades: classEntered,
        pendingGrades: Math.max(expected - classEntered, 0),
        completion: expected > 0 ? (classEntered / expected) * 100 : 0,
        average: classMaximum > 0 ? (classObtained / classMaximum) * 100 : null
      };
    });

    const studentMetrics = data.students.map((student) => {
      let studentEntered = 0;
      let studentObtained = 0;
      let studentMaximum = 0;
      const evaluatedClasses = new Set();

      allActivities.forEach((activity) => {
        const value = data.grades[`${student.id}:${activity.id}`];
        if (!hasGrade(value)) return;

        studentEntered += 1;
        studentObtained += Number(value);
        studentMaximum += Number(activity.maxScore);
        evaluatedClasses.add(activity.classId);
      });

      enteredGrades += studentEntered;
      obtainedPoints += studentObtained;
      evaluatedMaximum += studentMaximum;

      return {
        id: student.id,
        name: student.name,
        evaluatedClasses: evaluatedClasses.size,
        enteredGrades: studentEntered,
        pendingGrades: Math.max(allActivities.length - studentEntered, 0),
        completion:
          allActivities.length > 0
            ? (studentEntered / allActivities.length) * 100
            : 0,
        average:
          studentMaximum > 0 ? (studentObtained / studentMaximum) * 100 : null
      };
    });

    return {
      totalClasses: data.classes.length,
      classesWithActivities: data.classes.filter(
        (classItem) => classItem.activities.length > 0
      ).length,
      totalStudents: data.students.length,
      totalActivities: allActivities.length,
      enteredGrades,
      pendingGrades: Math.max(expectedGrades - enteredGrades, 0),
      completion: expectedGrades > 0 ? (enteredGrades / expectedGrades) * 100 : 0,
      average:
        evaluatedMaximum > 0 ? (obtainedPoints / evaluatedMaximum) * 100 : null,
      classMetrics,
      studentMetrics
    };
  }

  function displayPercentage(value) {
    return value === null ? 'Sin datos' : `${formatScore(value)} %`;
  }

  function renderDashboard() {
    const metrics = calculateMetrics();

    byId('metricClasses').textContent = metrics.totalClasses;
    byId('metricStudents').textContent = metrics.totalStudents;
    byId('metricActivities').textContent = metrics.totalActivities;
    byId('metricAverage').textContent = displayPercentage(metrics.average);
    byId('metricCompletion').textContent = `${formatScore(metrics.completion)} %`;
    byId('metricPending').textContent = metrics.pendingGrades;

    renderClassTable(metrics.classMetrics);
    renderStudentTable(metrics.studentMetrics);
    renderCharts(metrics);
  }

  function renderClassTable(items) {
    const rows = items
      .map(
        (item, index) => `
          <tr>
            <td>${index + 1}</td>
            <td class="name">${escapeHtml(item.name)}</td>
            <td>${item.activities}</td>
            <td>${item.enteredGrades}</td>
            <td>${item.pendingGrades}</td>
            <td>${formatScore(item.completion)} %</td>
            <td>${displayPercentage(item.average)}</td>
          </tr>`
      )
      .join('');

    byId('dashboardClassesTable').innerHTML = rows
      ? `<div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>N.º</th><th class="name">Clase</th><th>Actividades</th>
                <th>Notas registradas</th><th>Pendientes</th>
                <th>Registro</th><th>Promedio</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>`
      : '<div class="empty">Todavía no hay clases registradas.</div>';
  }

  function renderStudentTable(items) {
    const rows = items
      .map(
        (item, index) => `
          <tr>
            <td>${index + 1}</td>
            <td class="name">${escapeHtml(item.name)}</td>
            <td>${item.evaluatedClasses}</td>
            <td>${item.enteredGrades}</td>
            <td>${item.pendingGrades}</td>
            <td>${formatScore(item.completion)} %</td>
            <td>${displayPercentage(item.average)}</td>
          </tr>`
      )
      .join('');

    byId('dashboardStudentsTable').innerHTML = rows
      ? `<div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>N.º</th><th class="name">Estudiante</th><th>Clases evaluadas</th>
                <th>Notas registradas</th><th>Pendientes</th>
                <th>Registro</th><th>Rendimiento</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>`
      : '<div class="empty">Todavía no hay estudiantes registrados.</div>';
  }

  function renderCharts(metrics) {
    if (typeof Chart === 'undefined') {
      byId('chartsMessage').textContent =
        'No se pudo cargar Chart.js. Las tablas y exportaciones CSV siguen disponibles.';
      return;
    }

    const classCanvas = byId('classAverageChart');
    const distributionCanvas = byId('studentDistributionChart');

    classChart?.destroy();
    distributionChart?.destroy();

    classChart = new Chart(classCanvas, {
      type: 'bar',
      data: {
        labels: metrics.classMetrics.map((item) => item.name),
        datasets: [
          {
            label: 'Promedio por clase (%)',
            data: metrics.classMetrics.map((item) => item.average ?? 0)
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { beginAtZero: true, max: 100 }
        }
      }
    });

    const ranges = [
      { label: '0–59 %', min: 0, max: 59.999 },
      { label: '60–69 %', min: 60, max: 69.999 },
      { label: '70–79 %', min: 70, max: 79.999 },
      { label: '80–89 %', min: 80, max: 89.999 },
      { label: '90–100 %', min: 90, max: 100 }
    ];

    const evaluatedStudents = metrics.studentMetrics.filter(
      (item) => item.average !== null
    );

    distributionChart = new Chart(distributionCanvas, {
      type: 'bar',
      data: {
        labels: ranges.map((range) => range.label),
        datasets: [
          {
            label: 'Cantidad de estudiantes',
            data: ranges.map(
              (range) =>
                evaluatedStudents.filter(
                  (student) =>
                    student.average >= range.min && student.average <= range.max
                ).length
            )
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { beginAtZero: true, ticks: { precision: 0 } }
        }
      }
    });
  }

  function exportChart(chart, filename) {
    if (!chart) return alert('La gráfica todavía no está disponible.');

    const link = document.createElement('a');
    link.download = filename;
    link.href = chart.toBase64Image('image/png', 1);
    link.click();
  }

  function exportDashboardCsv() {
    const metrics = calculateMetrics();
    const headers = [
      'N.º',
      'Estudiante',
      'Clases evaluadas',
      'Notas registradas',
      'Notas pendientes',
      'Registro (%)',
      'Rendimiento (%)'
    ];

    const rows = metrics.studentMetrics.map((item, index) => [
      index + 1,
      item.name,
      item.evaluatedClasses,
      item.enteredGrades,
      item.pendingGrades,
      formatScore(item.completion),
      item.average === null ? '' : formatScore(item.average)
    ]);

    downloadFile(
      'dashboard-estudiantes.csv',
      `\ufeff${toCsv([headers, ...rows])}`,
      'text/csv;charset=utf-8'
    );
  }

  function bindEvents() {
    byId('exportClassChart').addEventListener('click', () => {
      exportChart(classChart, 'promedio-por-clase.png');
    });

    byId('exportDistributionChart').addEventListener('click', () => {
      exportChart(distributionChart, 'distribucion-estudiantes.png');
    });

    byId('exportDashboardCsv').addEventListener('click', exportDashboardCsv);
  }

  return { bindEvents, calculateMetrics, renderDashboard };
})();
