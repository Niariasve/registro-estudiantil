const DashboardModule = (() => {
  const { byId, downloadFile, escapeHtml, formatScore, normalizeScore, toCsv } = AppUtils;

  let currentTab = 'general';
  let classChart = null;
  let distributionChart = null;
  let diagnosticChart = null;

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

  function calculateDiagnosticMetrics() {
    const data = AppStorage.getData();
    const students = data.students;
    const diagData = data.diagnosticTests || { maxScore: 10, scores: {} };
    const maxScore = diagData.maxScore || 10;
    const scores = diagData.scores || {};

    let totalPre = 0;
    let countPre = 0;
    let totalPost = 0;
    let countPost = 0;

    const rows = students.map((s) => {
      const sScores = scores[s.id] || {};
      const pre = sScores.pre !== null && sScores.pre !== undefined && sScores.pre !== '' ? Number(sScores.pre) : null;
      const post = sScores.post !== null && sScores.post !== undefined && sScores.post !== '' ? Number(sScores.post) : null;

      if (pre !== null) {
        totalPre += pre;
        countPre++;
      }
      if (post !== null) {
        totalPost += post;
        countPost++;
      }

      const delta = (pre !== null && post !== null) ? post - pre : null;

      return {
        studentId: s.id,
        name: s.name,
        pre,
        post,
        delta
      };
    });

    const avgPre = countPre > 0 ? (totalPre / countPre) : null;
    const avgPost = countPost > 0 ? (totalPost / countPost) : null;
    const avgDelta = (avgPre !== null && avgPost !== null) ? (avgPost - avgPre) : null;

    return {
      maxScore,
      totalStudents: students.length,
      countPre,
      countPost,
      avgPre,
      avgPost,
      avgDelta,
      rows
    };
  }

  function displayPercentage(value) {
    return value === null ? 'Sin datos' : `${formatScore(value)} %`;
  }

  function displayScore(value, max) {
    return value === null ? 'Sin datos' : `${formatScore(value)} / ${max} pts`;
  }

  function renderDashboard() {
    if (currentTab === 'general') {
      byId('generalTabContent').hidden = false;
      byId('diagnosticTabContent').hidden = true;
      renderGeneralDashboard();
    } else {
      byId('generalTabContent').hidden = true;
      byId('diagnosticTabContent').hidden = false;
      renderDiagnosticDashboard();
    }
  }

  function renderGeneralDashboard() {
    const metrics = calculateMetrics();

    byId('metricClasses').textContent = metrics.totalClasses;
    byId('metricStudents').textContent = metrics.totalStudents;
    byId('metricActivities').textContent = metrics.totalActivities;
    byId('metricAverage').textContent = displayPercentage(metrics.average);
    byId('metricCompletion').textContent = `${formatScore(metrics.completion)} %`;
    byId('metricPending').textContent = metrics.pendingGrades;

    renderClassTable(metrics.classMetrics);
    renderStudentTable(metrics.studentMetrics);
    renderGeneralCharts(metrics);
  }

  function renderDiagnosticDashboard() {
    const diag = calculateDiagnosticMetrics();

    byId('diagMetricStudents').textContent = `${diag.countPre} / ${diag.totalStudents}`;
    byId('diagMetricPostCount').textContent = `${diag.countPost} / ${diag.totalStudents}`;
    byId('diagMetricAvgPre').textContent = displayScore(diag.avgPre, diag.maxScore);
    byId('diagMetricAvgPost').textContent = displayScore(diag.avgPost, diag.maxScore);

    const deltaEl = byId('diagMetricDelta');
    if (diag.avgDelta !== null) {
      const sign = diag.avgDelta > 0 ? '+' : '';
      deltaEl.textContent = `${sign}${formatScore(diag.avgDelta)} pts`;
      deltaEl.style.color = diag.avgDelta >= 0 ? '#166534' : '#b42318';
    } else {
      deltaEl.textContent = 'Sin datos';
      deltaEl.style.color = 'inherit';
    }

    renderDiagnosticTable(diag);
    renderDiagnosticChart(diag);
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

  function renderDiagnosticTable(diag) {
    const container = byId('diagnosticStudentsTable');
    if (!container) return;

    if (!diag.rows.length) {
      container.innerHTML = '<div class="empty">Primero registra estudiantes en el sistema.</div>';
      return;
    }

    const rows = diag.rows
      .map((item, index) => {
        let deltaBadge = '<span class="muted">-</span>';
        if (item.delta !== null) {
          if (item.delta > 0) {
            deltaBadge = `<span class="badge badge-success">+${formatScore(item.delta)} pts</span>`;
          } else if (item.delta < 0) {
            deltaBadge = `<span class="badge" style="background:#fee2e2; color:#991b1b;">${formatScore(item.delta)} pts</span>`;
          } else {
            deltaBadge = `<span class="badge badge-warning">0 pts</span>`;
          }
        }

        return `
          <tr>
            <td>${index + 1}</td>
            <td class="name">${escapeHtml(item.name)}</td>
            <td>
              <input type="number" min="0" max="${diag.maxScore}" step="0.1"
                data-diag-student="${item.studentId}" data-diag-type="pre"
                value="${item.pre !== null ? formatScore(item.pre) : ''}" placeholder="0 - ${diag.maxScore}" />
            </td>
            <td>
              <input type="number" min="0" max="${diag.maxScore}" step="0.1"
                data-diag-student="${item.studentId}" data-diag-type="post"
                value="${item.post !== null ? formatScore(item.post) : ''}" placeholder="0 - ${diag.maxScore}" />
            </td>
            <td>${deltaBadge}</td>
          </tr>`;
      })
      .join('');

    container.innerHTML = `
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th style="width: 50px;">N.º</th>
              <th class="name">Estudiante</th>
              <th style="width: 150px;">Pre-Test (Inicio)</th>
              <th style="width: 150px;">Post-Test (Final)</th>
              <th style="width: 150px;">Ganancia / Progreso</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  }

  function renderGeneralCharts(metrics) {
    if (typeof Chart === 'undefined') return;

    const classCanvas = byId('classAverageChart');
    const distributionCanvas = byId('studentDistributionChart');

    classChart?.destroy();
    distributionChart?.destroy();

    if (classCanvas) {
      classChart = new Chart(classCanvas, {
        type: 'bar',
        data: {
          labels: metrics.classMetrics.map((item) => item.name),
          datasets: [
            {
              label: 'Promedio por clase (%)',
              backgroundColor: '#0284c7',
              borderRadius: 6,
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
    }

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

    if (distributionCanvas) {
      distributionChart = new Chart(distributionCanvas, {
        type: 'bar',
        data: {
          labels: ranges.map((range) => range.label),
          datasets: [
            {
              label: 'Cantidad de estudiantes',
              backgroundColor: '#10b981',
              borderRadius: 6,
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
  }

  function renderDiagnosticChart(diag) {
    if (typeof Chart === 'undefined') return;

    const canvas = byId('diagnosticComparisonChart');
    if (!canvas) return;

    diagnosticChart?.destroy();

    // Group students who have at least one test recorded
    const evaluated = diag.rows.filter((r) => r.pre !== null || r.post !== null);

    const labels = evaluated.length
      ? evaluated.map((r) => r.name.split(' ')[0] + ' ' + (r.name.split(' ')[1] || ''))
      : ['Promedio General'];

    const preData = evaluated.length
      ? evaluated.map((r) => r.pre ?? 0)
      : [diag.avgPre ?? 0];

    const postData = evaluated.length
      ? evaluated.map((r) => r.post ?? 0)
      : [diag.avgPost ?? 0];

    diagnosticChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Pre-Test (Diagnóstico Inicial)',
            backgroundColor: '#f59e0b',
            borderRadius: 6,
            data: preData
          },
          {
            label: 'Post-Test (Evaluación Final)',
            backgroundColor: '#10b981',
            borderRadius: 6,
            data: postData
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { beginAtZero: true, max: diag.maxScore }
        }
      }
    });
  }

  async function updateDiagnosticGrade(input) {
    const studentId = input.dataset.diagStudent;
    const type = input.dataset.diagType; // 'pre' or 'post'
    const value = normalizeScore(input.value);

    const data = AppStorage.getData();
    if (!data.diagnosticTests) {
      data.diagnosticTests = { maxScore: 10, scores: {} };
    }
    if (!data.diagnosticTests.scores) {
      data.diagnosticTests.scores = {};
    }
    if (!data.diagnosticTests.scores[studentId]) {
      data.diagnosticTests.scores[studentId] = { pre: null, post: null };
    }

    const previousData = AppStorage.snapshot();

    if (value === '') {
      data.diagnosticTests.scores[studentId][type] = null;
    } else {
      const maxScore = data.diagnosticTests.maxScore || 10;
      data.diagnosticTests.scores[studentId][type] = Math.min(Number(value), maxScore);
    }

    try {
      await AppStorage.persistNow();
      renderDiagnosticDashboard();
    } catch (error) {
      AppStorage.replaceData(previousData);
      console.error(error);
      alert(error.message || 'No se pudo guardar la calificación del test.');
    }
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
      'dashboard-rendimiento-general.csv',
      `\ufeff${toCsv([headers, ...rows])}`,
      'text/csv;charset=utf-8'
    );
  }

  function exportDiagnosticCsv() {
    const diag = calculateDiagnosticMetrics();
    const headers = [
      'N.º',
      'Estudiante',
      `Pre-Test / ${diag.maxScore}`,
      `Post-Test / ${diag.maxScore}`,
      'Diferencia (Puntos Ganados)'
    ];

    const rows = diag.rows.map((item, index) => [
      index + 1,
      item.name,
      item.pre !== null ? formatScore(item.pre) : '',
      item.post !== null ? formatScore(item.post) : '',
      item.delta !== null ? formatScore(item.delta) : ''
    ]);

    downloadFile(
      'test-diagnostico-vs-final.csv',
      `\ufeff${toCsv([headers, ...rows])}`,
      'text/csv;charset=utf-8'
    );
  }

  function bindEvents() {
    byId('tabBtnGeneral')?.addEventListener('click', () => {
      currentTab = 'general';
      byId('tabBtnGeneral').classList.add('active');
      byId('tabBtnDiagnostic').classList.remove('active');
      renderDashboard();
    });

    byId('tabBtnDiagnostic')?.addEventListener('click', () => {
      currentTab = 'diagnostic';
      byId('tabBtnDiagnostic').classList.add('active');
      byId('tabBtnGeneral').classList.remove('active');
      renderDashboard();
    });

    byId('exportClassChart')?.addEventListener('click', () => {
      exportChart(classChart, 'promedio-por-clase.png');
    });

    byId('exportDistributionChart')?.addEventListener('click', () => {
      exportChart(distributionChart, 'distribucion-estudiantes.png');
    });

    byId('exportDiagnosticChart')?.addEventListener('click', () => {
      exportChart(diagnosticChart, 'comparativa-pre-post-test.png');
    });

    byId('exportDashboardCsv')?.addEventListener('click', exportDashboardCsv);
    byId('exportDiagnosticCsv')?.addEventListener('click', exportDiagnosticCsv);

    document.addEventListener('change', (event) => {
      if (event.target.matches('[data-diag-student]')) {
        updateDiagnosticGrade(event.target);
      }
    });
  }

  return { bindEvents, calculateMetrics, calculateDiagnosticMetrics, renderDashboard };
})();
