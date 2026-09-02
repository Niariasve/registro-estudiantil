const DashboardModule = (() => {
  const { byId, downloadFile, escapeHtml, formatScore, normalizeScore, toCsv } = AppUtils;

  let currentTab = 'overview'; // 'overview' | 'pre' | 'post'

  let classChart = null;
  let distributionChart = null;

  // Test results charts
  let chartGlobal = null;
  let chartLevels = null;
  let chartRadar = null;
  let chartImpact = null;

  let searchFilter = '';
  let searchPreFilter = '';
  let searchPostFilter = '';
  let toastTimer = null;

  const defaultKey = {
    P4: 'C', P5: 'C', P6: 'C', P7: 'B', P8: 'B', P9: 'B', P10: 'B', P11: 'A', P12: 'B', P13: 'B', P14: 'C'
  };
  const qCols = ['P4', 'P5', 'P6', 'P7', 'P8', 'P9', 'P10', 'P11', 'P12', 'P13', 'P14'];
  const percepCols = ['P1', 'P2', 'P3'];

  function showToast(message = 'Calificacion guardada exitosamente') {
    const toast = byId('saveToast');
    const msgEl = byId('toastMessage');
    if (!toast || !msgEl) return;

    msgEl.textContent = message;
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
    }, 2200);
  }

  function hasGrade(value) {
    return value !== undefined && value !== null && value !== '';
  }

  // ──────────────────────────────────────────────
  // TAB 1: GENERAL METRICS
  // ──────────────────────────────────────────────

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
        completion: allActivities.length > 0 ? (studentEntered / allActivities.length) * 100 : 0,
        average: studentMaximum > 0 ? (studentObtained / studentMaximum) * 100 : null
      };
    });

    return {
      totalClasses: data.classes.length,
      totalStudents: data.students.length,
      totalActivities: allActivities.length,
      enteredGrades,
      pendingGrades: Math.max(expectedGrades - enteredGrades, 0),
      completion: expectedGrades > 0 ? (enteredGrades / expectedGrades) * 100 : 0,
      average: evaluatedMaximum > 0 ? (obtainedPoints / evaluatedMaximum) * 100 : null,
      classMetrics,
      studentMetrics
    };
  }

  function displayPercentage(value) {
    return value === null ? 'Sin datos' : `${formatScore(value)} %`;
  }

  // ──────────────────────────────────────────────
  // RENDER DISPATCHER
  // ──────────────────────────────────────────────

  function renderDashboard() {
    const diag = getDiagnosticData();

    const viewOverview = byId('subViewOverview');
    const viewPre = byId('subViewPreMatrix');
    const viewPost = byId('subViewPostMatrix');

    if (viewOverview) viewOverview.hidden = currentTab !== 'overview';
    if (viewPre) viewPre.hidden = currentTab !== 'pre';
    if (viewPost) viewPost.hidden = currentTab !== 'post';

    byId('tabOverview')?.classList.toggle('active', currentTab === 'overview');
    byId('tabPre')?.classList.toggle('active', currentTab === 'pre');
    byId('tabPost')?.classList.toggle('active', currentTab === 'post');

    if (currentTab === 'overview') {
      renderOverviewTab(diag);
    } else if (currentTab === 'pre') {
      renderMatrixTable('pre', diag);
    } else if (currentTab === 'post') {
      renderMatrixTable('post', diag);
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

  function renderClassTable(items) {
    const rows = items
      .map((item, index) => `
        <tr>
          <td>${index + 1}</td>
          <td class="name">${escapeHtml(item.name)}</td>
          <td>${item.activities}</td>
          <td>${item.enteredGrades}</td>
          <td>${item.pendingGrades}</td>
          <td>${formatScore(item.completion)} %</td>
          <td>${displayPercentage(item.average)}</td>
        </tr>`)
      .join('');

    byId('dashboardClassesTable').innerHTML = rows
      ? `<div class="table-wrap">
          <table>
            <thead><tr><th>N.º</th><th class="name">Clase</th><th>Actividades</th><th>Notas registradas</th><th>Pendientes</th><th>Registro</th><th>Promedio</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>`
      : '<div class="empty">Todavía no hay clases registradas.</div>';
  }

  function renderStudentTable(items) {
    const rows = items
      .map((item, index) => `
        <tr>
          <td>${index + 1}</td>
          <td class="name">${escapeHtml(item.name)}</td>
          <td>${item.evaluatedClasses}</td>
          <td>${item.enteredGrades}</td>
          <td>${item.pendingGrades}</td>
          <td>${formatScore(item.completion)} %</td>
          <td>${displayPercentage(item.average)}</td>
        </tr>`)
      .join('');

    byId('dashboardStudentsTable').innerHTML = rows
      ? `<div class="table-wrap">
          <table>
            <thead><tr><th>N.º</th><th class="name">Estudiante</th><th>Clases evaluadas</th><th>Notas registradas</th><th>Pendientes</th><th>Registro</th><th>Rendimiento</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>`
      : '<div class="empty">Todavía no hay estudiantes registrados.</div>';
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
          datasets: [{
            label: 'Promedio por clase (%)',
            backgroundColor: '#0284c7',
            borderRadius: 6,
            data: metrics.classMetrics.map((item) => item.average ?? 0)
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: { y: { beginAtZero: true, max: 100 } }
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

    const evaluated = metrics.studentMetrics.filter((item) => item.average !== null);

    if (distributionCanvas) {
      distributionChart = new Chart(distributionCanvas, {
        type: 'bar',
        data: {
          labels: ranges.map((r) => r.label),
          datasets: [{
            label: 'Cantidad de estudiantes',
            backgroundColor: '#10b981',
            borderRadius: 6,
            data: ranges.map((r) => evaluated.filter((s) => s.average >= r.min && s.average <= r.max).length)
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
        }
      });
    }
  }

  // ──────────────────────────────────────────────
  // TAB 2: DIAGNOSTIC TAB & SUB-VIEWS
  // ──────────────────────────────────────────────

  function getDiagnosticData() {
    const data = AppStorage.getData();
    const students = data.students || [];
    const diagData = data.diagnosticTests || { maxScore: 10, scores: {} };
    const maxScore = diagData.maxScore || 10;
    const scores = diagData.scores || {};

    let countPre = 0, countPost = 0, sumPre = 0, sumPost = 0;
    let paired = 0, pairedSumPre = 0, pairedSumPost = 0;
    let improved = 0, declined = 0, same = 0;
    let passedPre = 0, passedPost = 0;

    const levels = {
      insuficiente: { pre: 0, post: 0 },
      regular: { pre: 0, post: 0 },
      bueno: { pre: 0, post: 0 },
      excelente: { pre: 0, post: 0 }
    };

    function classifyLevel(score) {
      if (score < 5.0) return 'insuficiente';
      if (score < 7.0) return 'regular';
      if (score < 9.0) return 'bueno';
      return 'excelente';
    }

    const rows = students.map((s, idx) => {
      const sc = scores[s.id] || {};
      const pre = sc.pre !== null && sc.pre !== undefined && sc.pre !== '' ? Number(sc.pre) : null;
      const post = sc.post !== null && sc.post !== undefined && sc.post !== '' ? Number(sc.post) : null;

      if (pre !== null) {
        countPre++;
        sumPre += pre;
        if (pre >= 7.0) passedPre++;
        levels[classifyLevel(pre)].pre++;
      }

      if (post !== null) {
        countPost++;
        sumPost += post;
        if (post >= 7.0) passedPost++;
        levels[classifyLevel(post)].post++;
      }

      if (pre !== null && post !== null) {
        paired++;
        pairedSumPre += pre;
        pairedSumPost += post;
        if (post > pre) improved++;
        else if (post < pre) declined++;
        else same++;
      }

      const delta = (pre !== null && post !== null) ? Number((post - pre).toFixed(2)) : null;

      return {
        num: s.num || idx + 1,
        studentId: s.id,
        name: s.name,
        cedula: s.cedula || '',
        pre,
        post,
        delta,
        preAnswers: sc.preAnswers || {},
        postAnswers: sc.postAnswers || {},
        prePerception: sc.prePerception || {},
        postPerception: sc.postPerception || {}
      };
    });

    const avgPre = countPre > 0 ? (sumPre / countPre) : null;
    const avgPost = countPost > 0 ? (sumPost / countPost) : null;
    const delta = (avgPre !== null && avgPost !== null) ? (avgPost - avgPre) : null;
    const approvalPre = countPre > 0 ? ((passedPre / countPre) * 100) : 0;
    const approvalPost = countPost > 0 ? ((passedPost / countPost) * 100) : 0;
    const improvedPct = paired > 0 ? ((improved / paired) * 100) : 0;

    return {
      maxScore,
      totalEnrolled: students.length,
      countPre,
      countPost,
      avgPre,
      avgPost,
      delta,
      paired,
      pairedSumPre,
      pairedSumPost,
      improved,
      declined,
      same,
      improvedPct,
      approvalPre,
      approvalPost,
      levels,
      rows
    };
  }

  function renderDiagnosticTab() {
    const diag = getDiagnosticData();

    // Toggle sub-views
    const viewOverview = byId('subViewOverview');
    const viewPre = byId('subViewPreMatrix');
    const viewPost = byId('subViewPostMatrix');

    if (viewOverview) viewOverview.hidden = currentSubTab !== 'overview';
    if (viewPre) viewPre.hidden = currentSubTab !== 'pre-matrix';
    if (viewPost) viewPost.hidden = currentSubTab !== 'post-matrix';

    // Update subnav buttons
    byId('subTabOverview')?.classList.toggle('active', currentSubTab === 'overview');
    byId('subTabPreMatrix')?.classList.toggle('active', currentSubTab === 'pre-matrix');
    byId('subTabPostMatrix')?.classList.toggle('active', currentSubTab === 'post-matrix');

    if (currentSubTab === 'overview') {
      renderOverviewTab(diag);
    } else if (currentSubTab === 'pre-matrix') {
      renderMatrixTable('pre', diag);
    } else if (currentSubTab === 'post-matrix') {
      renderMatrixTable('post', diag);
    }
  }

  function renderOverviewTab(diag) {
    // 1. Summary Cards
    const cardsContainer = byId('resultsSummaryCards');
    if (cardsContainer) {
      cardsContainer.innerHTML = `
        <div class="result-card">
          <div class="rc-label">Matriculados</div>
          <div class="rc-value">${diag.totalEnrolled}</div>
          <div class="rc-sub">estudiantes en el paralelo</div>
        </div>
        <div class="result-card">
          <div class="rc-label">Evaluados (Pre / Post)</div>
          <div class="rc-value">${diag.countPre} / ${diag.countPost}</div>
          <div class="rc-sub">rindieron cada prueba</div>
        </div>
        <div class="result-card">
          <div class="rc-label">Promedio Pre-Test</div>
          <div class="rc-value blue">${diag.avgPre !== null ? diag.avgPre.toFixed(2) : '—'}</div>
          <div class="rc-sub">sobre 10 puntos</div>
        </div>
        <div class="result-card">
          <div class="rc-label">Promedio Post-Test</div>
          <div class="rc-value orange">${diag.avgPost !== null ? diag.avgPost.toFixed(2) : '—'}</div>
          <div class="rc-sub">sobre 10 puntos</div>
        </div>
        <div class="result-card">
          <div class="rc-label">Ganancia Promedio</div>
          <div class="rc-value ${diag.delta !== null && diag.delta >= 0 ? 'positive' : 'negative'}">${diag.delta !== null ? (diag.delta >= 0 ? '+' : '') + diag.delta.toFixed(2) : '—'}</div>
          <div class="rc-sub">puntos de mejora</div>
        </div>
        <div class="result-card">
          <div class="rc-label">Estudiantes que Mejoraron</div>
          <div class="rc-value positive">${diag.improved} de ${diag.paired}</div>
          <div class="rc-sub">${diag.improvedPct.toFixed(0)}% del grupo pareado</div>
        </div>
      `;
    }

    // 2. Charts
    renderDiagnosticCharts(diag);
  }

  function renderDiagnosticCharts(diag) {
    if (typeof Chart === 'undefined') return;

    chartGlobal?.destroy();
    chartLevels?.destroy();
    chartRadar?.destroy();
    chartImpact?.destroy();

    // CHART 1: Comparativa Global
    const canvasGlobal = byId('chartGlobalComparison');
    if (canvasGlobal) {
      chartGlobal = new Chart(canvasGlobal, {
        type: 'bar',
        data: {
          labels: ['Promedio General', `Pareados (N=${diag.paired})`, 'Tasa de Aprobación (≥7.0)'],
          datasets: [
            {
              label: 'Pre-Test (Diagnóstico Inicial)',
              backgroundColor: 'rgba(2, 132, 199, 0.85)',
              borderRadius: 8,
              barPercentage: 0.6,
              data: [
                diag.avgPre !== null ? Number(diag.avgPre.toFixed(2)) : 0,
                diag.paired > 0 ? Number((diag.pairedSumPre / diag.paired).toFixed(2)) : 0,
                Number(diag.approvalPre.toFixed(1))
              ]
            },
            {
              label: 'Post-Test (Evaluación Final)',
              backgroundColor: 'rgba(234, 88, 12, 0.85)',
              borderRadius: 8,
              barPercentage: 0.6,
              data: [
                diag.avgPost !== null ? Number(diag.avgPost.toFixed(2)) : 0,
                diag.paired > 0 ? Number((diag.pairedSumPost / diag.paired).toFixed(2)) : 0,
                Number(diag.approvalPost.toFixed(1))
              ]
            }
          ]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { padding: 16, usePointStyle: true, pointStyle: 'rectRounded' } },
            tooltip: {
              callbacks: {
                label: (ctx) => {
                  const unit = ctx.dataIndex === 2 ? '%' : ' pts';
                  return ` ${ctx.dataset.label}: ${ctx.raw}${unit}`;
                }
              }
            }
          },
          scales: {
            x: { beginAtZero: true, max: 100, ticks: { stepSize: 20 } }
          }
        }
      });

      const insightEl = byId('insightGlobal');
      if (insightEl) {
        const approvalDelta = diag.approvalPost - diag.approvalPre;
        if (approvalDelta > 0) {
          insightEl.className = 'chart-insight positive';
          insightEl.textContent = `La tasa de aprobación subió de ${diag.approvalPre.toFixed(1)}% a ${diag.approvalPost.toFixed(1)}%, un incremento de +${approvalDelta.toFixed(1)} puntos porcentuales tras la capacitación.`;
        } else if (approvalDelta < 0) {
          insightEl.className = 'chart-insight negative';
          insightEl.textContent = `La tasa de aprobación varió de ${diag.approvalPre.toFixed(1)}% a ${diag.approvalPost.toFixed(1)}%.`;
        } else {
          insightEl.className = 'chart-insight neutral';
          insightEl.textContent = `La tasa de aprobación se mantuvo en ${diag.approvalPre.toFixed(1)}%.`;
        }
      }
    }

    // CHART 2: Niveles
    const canvasLevels = byId('chartLevelsDistribution');
    if (canvasLevels) {
      const levelLabels = ['Insuficiente\n(< 5.0 pts)', 'Regular\n(5.0 – 6.9)', 'Bueno\n(7.0 – 8.9)', 'Excelente\n(9.0 – 10.0)'];
      const preData = [diag.levels.insuficiente.pre, diag.levels.regular.pre, diag.levels.bueno.pre, diag.levels.excelente.pre];
      const postData = [diag.levels.insuficiente.post, diag.levels.regular.post, diag.levels.bueno.post, diag.levels.excelente.post];

      chartLevels = new Chart(canvasLevels, {
        type: 'bar',
        data: {
          labels: levelLabels,
          datasets: [
            {
              label: 'Pre-Test',
              backgroundColor: 'rgba(2, 132, 199, 0.8)',
              borderRadius: 8,
              barPercentage: 0.55,
              data: preData
            },
            {
              label: 'Post-Test',
              backgroundColor: 'rgba(234, 88, 12, 0.8)',
              borderRadius: 8,
              barPercentage: 0.55,
              data: postData
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { padding: 16, usePointStyle: true, pointStyle: 'rectRounded' } },
            tooltip: {
              callbacks: {
                label: (ctx) => ` ${ctx.dataset.label}: ${ctx.raw} estudiantes`
              }
            }
          },
          scales: {
            y: { beginAtZero: true, ticks: { precision: 0, stepSize: 5 } }
          }
        }
      });

      const insightEl = byId('insightLevels');
      if (insightEl) {
        const insufDelta = diag.levels.insuficiente.post - diag.levels.insuficiente.pre;
        if (insufDelta < 0) {
          insightEl.className = 'chart-insight positive';
          insightEl.textContent = `El número de estudiantes en nivel "Insuficiente" se redujo de ${diag.levels.insuficiente.pre} a ${diag.levels.insuficiente.post} (−${Math.abs(insufDelta)}), mostrando avances en los estudiantes con mayor necesidad.`;
        } else {
          insightEl.className = 'chart-insight neutral';
          insightEl.textContent = `Distribución de niveles: Pre-Test (Insuf: ${diag.levels.insuficiente.pre}, Reg: ${diag.levels.regular.pre}, Bueno: ${diag.levels.bueno.pre}, Exc: ${diag.levels.excelente.pre}) vs. Post-Test (Insuf: ${diag.levels.insuficiente.post}, Reg: ${diag.levels.regular.post}, Bueno: ${diag.levels.bueno.post}, Exc: ${diag.levels.excelente.post}).`;
        }
      }
    }

    // CHART 3: Radar
    const canvasRadar = byId('chartCompetencyRadar');
    if (canvasRadar) {
      const competencies = [
        { label: 'Hardware y Software', pre: 31.6, post: 45.3 },
        { label: 'Patrones y Abstracción', pre: 71.1, post: 68.0 },
        { label: 'Algoritmos y Secuencias', pre: 76.3, post: 85.4 },
        { label: 'Lógica y Bucles', pre: 65.8, post: 50.0 }
      ];

      chartRadar = new Chart(canvasRadar, {
        type: 'radar',
        data: {
          labels: competencies.map(c => c.label),
          datasets: [
            {
              label: 'Pre-Test (%)',
              data: competencies.map(c => c.pre),
              backgroundColor: 'rgba(2, 132, 199, 0.15)',
              borderColor: 'rgba(2, 132, 199, 0.9)',
              borderWidth: 2.5,
              pointBackgroundColor: '#0284c7',
              pointRadius: 5
            },
            {
              label: 'Post-Test (%)',
              data: competencies.map(c => c.post),
              backgroundColor: 'rgba(234, 88, 12, 0.12)',
              borderColor: 'rgba(234, 88, 12, 0.9)',
              borderWidth: 2.5,
              pointBackgroundColor: '#ea580c',
              pointRadius: 5
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { padding: 16, usePointStyle: true } },
            tooltip: {
              callbacks: { label: (ctx) => ` ${ctx.dataset.label}: ${ctx.raw}%` }
            }
          },
          scales: {
            r: {
              beginAtZero: true,
              max: 100,
              ticks: { stepSize: 25, backdropColor: 'transparent', font: { size: 10 } },
              pointLabels: { font: { size: 12, weight: '600' } }
            }
          }
        }
      });

      const insightEl = byId('insightCompetency');
      if (insightEl) {
        insightEl.className = 'chart-insight positive';
        insightEl.textContent = `Mayor crecimiento observado en "Hardware y Software" (+13.7 pp) y "Algoritmos y Secuencias" (+9.1 pp). Se recomienda reforzar conceptos de bucles y condicionales.`;
      }
    }

    // CHART 4: Doughnut
    const canvasImpact = byId('chartImpactDoughnut');
    if (canvasImpact && diag.paired > 0) {
      chartImpact = new Chart(canvasImpact, {
        type: 'doughnut',
        data: {
          labels: [
            `Mejoraron (${diag.improved})`,
            `Mantuvieron (${diag.same})`,
            `Bajaron (${diag.declined})`
          ],
          datasets: [{
            data: [diag.improved, diag.same, diag.declined],
            backgroundColor: ['#16a34a', '#64748b', '#dc2626'],
            hoverBackgroundColor: ['#15803d', '#475569', '#b91c1c'],
            borderWidth: 3,
            borderColor: '#ffffff'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '55%',
          plugins: {
            legend: { position: 'bottom', labels: { padding: 16, usePointStyle: true, pointStyle: 'circle', font: { size: 13, weight: '600' } } },
            tooltip: {
              callbacks: {
                label: (ctx) => {
                  const pct = diag.paired > 0 ? ((ctx.raw / diag.paired) * 100).toFixed(1) : 0;
                  return ` ${ctx.label}: ${pct}% del grupo pareado`;
                }
              }
            }
          }
        }
      });

      const insightEl = byId('insightImpact');
      if (insightEl) {
        insightEl.className = 'chart-insight neutral';
        insightEl.textContent = `De los ${diag.paired} estudiantes que rindieron ambas pruebas, ${diag.improved} aumentaron su puntaje, ${diag.same} mantuvieron su nivel y ${diag.declined} obtuvieron un resultado menor.`;
      }
    }
  }

  // ──────────────────────────────────────────────
  // MATRIX TABLES (EXCEL-LIKE SHEET P1 - P14)
  // ──────────────────────────────────────────────

  function renderMatrixTable(type, diag) {
    const containerId = type === 'pre' ? 'preTestMatrixContainer' : 'postTestMatrixContainer';
    const container = byId(containerId);
    if (!container) return;

    const filterText = (type === 'pre' ? searchPreFilter : searchPostFilter).toLowerCase().trim();
    let filtered = diag.rows;
    if (filterText) {
      filtered = filtered.filter(r => r.name.toLowerCase().includes(filterText) || r.cedula.toLowerCase().includes(filterText));
    }

    const answersKey = type === 'pre' ? 'preAnswers' : 'postAnswers';
    const percepKey = type === 'pre' ? 'prePerception' : 'postPerception';

    // Calculate totals per question
    const qTotals = {};
    let totalEvaluated = 0;
    qCols.forEach(q => { qTotals[q] = 0; });

    diag.rows.forEach(r => {
      const answers = r[answersKey] || {};
      let hasAny = false;
      qCols.forEach(q => {
        const val = (answers[q] || '').trim().toUpperCase();
        if (val && val !== '-' && val !== 'M') hasAny = true;
        if (val === defaultKey[q]) qTotals[q]++;
      });
      if (hasAny) totalEvaluated++;
    });

    const rowsHtml = filtered.map(item => {
      const answers = item[answersKey] || {};
      const percep = item[percepKey] || {};

      let correctCount = 0;
      let hasAttempted = false;

      const percepCells = percepCols.map(p => {
        const val = (percep[p] || '-').trim().toUpperCase();
        return `
          <td>
            <input type="text" maxlength="2"
              class="cell-input cell-percep"
              data-matrix-type="${type}" data-matrix-cat="percep" data-matrix-student="${item.studentId}" data-matrix-q="${p}"
              value="${val}" placeholder="-" />
          </td>
        `;
      }).join('');

      const questionCells = qCols.map(q => {
        const val = (answers[q] || '-').trim().toUpperCase();
        const expected = defaultKey[q];
        let statusClass = 'cell-empty';

        if (val && val !== '-' && val !== 'M') {
          hasAttempted = true;
          if (val === expected) {
            statusClass = 'cell-correct';
            correctCount++;
          } else {
            statusClass = 'cell-incorrect';
          }
        }

        return `
          <td>
            <input type="text" maxlength="1"
              class="cell-input ${statusClass}"
              data-matrix-type="${type}" data-matrix-cat="answer" data-matrix-student="${item.studentId}" data-matrix-q="${q}"
              value="${val}" placeholder="-" />
          </td>
        `;
      }).join('');

      const scoreVal = hasAttempted ? Number(((correctCount / 11) * 10).toFixed(2)) : null;

      return `
        <tr data-student-id="${item.studentId}">
          <td style="font-weight: 700; color: #64748b; width: 38px;">${item.num}</td>
          <td class="td-student" title="${escapeHtml(item.name)}">
            <div>${escapeHtml(item.name)}</div>
            ${item.cedula ? `<div style="font-size: 10.5px; color: #94a3b8; font-weight: normal;">C.I. ${item.cedula}</div>` : ''}
          </td>
          ${percepCells}
          ${questionCells}
          <td style="font-weight: 700; color: #0369a1; width: 65px;" id="matrix-aciertos-${type}-${item.studentId}">
            ${hasAttempted ? `${correctCount} / 11` : '—'}
          </td>
          <td style="font-weight: 800; font-size: 13px; color: ${scoreVal !== null && scoreVal >= 7 ? '#15803d' : (scoreVal !== null ? '#b91c1c' : '#64748b')}; width: 85px;" id="matrix-score-${type}-${item.studentId}">
            ${scoreVal !== null ? `${formatScore(scoreVal)} pts` : '—'}
          </td>
        </tr>
      `;
    }).join('');

    // Footer row with totals
    const footerQuestionCells = qCols.map(q => {
      const correct = qTotals[q] || 0;
      const pct = totalEvaluated > 0 ? ((correct / totalEvaluated) * 100).toFixed(0) : 0;
      return `
        <td style="font-size: 10.5px; line-height: 1.2;">
          <div>${correct}</div>
          <div style="color: #64748b; font-size: 9.5px;">${pct}%</div>
        </td>
      `;
    }).join('');

    container.innerHTML = `
      <div class="matrix-wrap">
        <table class="matrix-table">
          <thead>
            <tr>
              <th style="width: 38px;">N.º</th>
              <th style="min-width: 190px; text-align: left; padding-left: 10px;">Estudiante</th>
              <th class="th-percep" title="Percepción: P1">P1</th>
              <th class="th-percep" title="Percepción: P2">P2</th>
              <th class="th-percep" title="Percepción: P3">P3</th>
              <th class="th-cog">P4</th>
              <th class="th-cog">P5</th>
              <th class="th-cog">P6</th>
              <th class="th-cog">P7</th>
              <th class="th-cog">P8</th>
              <th class="th-cog">P9</th>
              <th class="th-cog">P10</th>
              <th class="th-cog">P11</th>
              <th class="th-cog">P12</th>
              <th class="th-cog">P13</th>
              <th class="th-cog">P14</th>
              <th class="th-score" style="width: 65px;">Aciertos</th>
              <th class="th-score" style="width: 85px;">Nota / 10</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || '<tr><td colspan="18" style="padding: 24px; color: #94a3b8;">No se encontraron estudiantes.</td></tr>'}
          </tbody>
          <tfoot>
            <tr class="matrix-footer-row">
              <td colspan="2" style="text-align: left; padding-left: 10px;">Aciertos Grupales (N=${totalEvaluated})</td>
              <td colspan="3" style="color: #94a3b8; font-size: 11px;">Percepción</td>
              ${footerQuestionCells}
              <td style="color: #0369a1;">Total</td>
              <td style="color: #0f172a;">${type === 'pre' ? (diag.avgPre !== null ? formatScore(diag.avgPre) + ' pts' : '—') : (diag.avgPost !== null ? formatScore(diag.avgPost) + ' pts' : '—')}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    `;
  }

  async function handleMatrixCellChange(input) {
    const type = input.dataset.matrixType; // 'pre' or 'post'
    const cat = input.dataset.matrixCat; // 'percep' or 'answer'
    const studentId = input.dataset.matrixStudent;
    const q = input.dataset.matrixQ;
    let val = input.value.trim().toUpperCase();

    if (!val) val = '-';
    input.value = val;

    const data = AppStorage.getData();
    if (!data.diagnosticTests) data.diagnosticTests = { maxScore: 10, scores: {} };
    if (!data.diagnosticTests.scores) data.diagnosticTests.scores = {};
    if (!data.diagnosticTests.scores[studentId]) {
      data.diagnosticTests.scores[studentId] = { pre: null, post: null, preAnswers: {}, postAnswers: {}, prePerception: {}, postPerception: {} };
    }

    const studentScoreObj = data.diagnosticTests.scores[studentId];
    if (cat === 'percep') {
      const percepKey = type === 'pre' ? 'prePerception' : 'postPerception';
      if (!studentScoreObj[percepKey]) studentScoreObj[percepKey] = {};
      studentScoreObj[percepKey][q] = val;
    } else {
      const answersKey = type === 'pre' ? 'preAnswers' : 'postAnswers';
      if (!studentScoreObj[answersKey]) studentScoreObj[answersKey] = {};
      studentScoreObj[answersKey][q] = val;

      // Recalculate student score from answers
      const answers = studentScoreObj[answersKey];
      let correctCount = 0;
      let attempted = false;
      qCols.forEach(col => {
        const aVal = (answers[col] || '').trim().toUpperCase();
        if (aVal && aVal !== '-' && aVal !== 'M') attempted = true;
        if (aVal === defaultKey[col]) correctCount++;
      });

      const finalScore = attempted ? Number(((correctCount / 11) * 10).toFixed(2)) : null;
      studentScoreObj[type] = finalScore;

      // Sync with class activity
      const actId = type === 'pre' ? 'act-pretest' : 'act-posttest';
      if (finalScore !== null) {
        data.grades[`${studentId}:${actId}`] = finalScore;
      } else {
        delete data.grades[`${studentId}:${actId}`];
      }

      // Update cell styling
      input.className = 'cell-input ' + (val === defaultKey[q] ? 'cell-correct' : (val !== '-' && val !== '' ? 'cell-incorrect' : 'cell-empty'));

      // Update row aciertos and score elements directly for instant feedback
      const aciertosEl = byId(`matrix-aciertos-${type}-${studentId}`);
      const scoreEl = byId(`matrix-score-${type}-${studentId}`);
      if (aciertosEl) aciertosEl.textContent = attempted ? `${correctCount} / 11` : '—';
      if (scoreEl) {
        scoreEl.textContent = finalScore !== null ? `${formatScore(finalScore)} pts` : '—';
        scoreEl.style.color = finalScore !== null && finalScore >= 7 ? '#15803d' : (finalScore !== null ? '#b91c1c' : '#64748b');
      }
    }

    try {
      await AppStorage.persistNow();
      showToast('Calificacion recalculada y guardada');
    } catch (err) {
      console.error(err);
      alert('No se pudo guardar el cambio en la matriz.');
    }
  }

  function exportMatrixCsv(type) {
    const diag = getDiagnosticData();
    const answersKey = type === 'pre' ? 'preAnswers' : 'postAnswers';
    const percepKey = type === 'pre' ? 'prePerception' : 'postPerception';

    const headers = ['N.º', 'Cédula', 'Estudiante', 'P1', 'P2', 'P3', 'P4 (C)', 'P5 (C)', 'P6 (C)', 'P7 (B)', 'P8 (B)', 'P9 (B)', 'P10 (B)', 'P11 (A)', 'P12 (B)', 'P13 (B)', 'P14 (C)', 'Aciertos', 'Calificación'];

    const rows = diag.rows.map(item => {
      const answers = item[answersKey] || {};
      const percep = item[percepKey] || {};
      const score = item[type];

      let correct = 0;
      let att = false;
      qCols.forEach(q => {
        const val = (answers[q] || '').trim().toUpperCase();
        if (val && val !== '-' && val !== 'M') att = true;
        if (val === defaultKey[q]) correct++;
      });

      return [
        item.num,
        item.cedula,
        item.name,
        percep.P1 || '-',
        percep.P2 || '-',
        percep.P3 || '-',
        answers.P4 || '-',
        answers.P5 || '-',
        answers.P6 || '-',
        answers.P7 || '-',
        answers.P8 || '-',
        answers.P9 || '-',
        answers.P10 || '-',
        answers.P11 || '-',
        answers.P12 || '-',
        answers.P13 || '-',
        answers.P14 || '-',
        att ? `${correct} / 11` : 'Sin rendir',
        score !== null ? formatScore(score) : 'Sin nota'
      ];
    });

    const filename = `matriz-respuestas-${type === 'pre' ? 'pre-test' : 'post-test'}-paralelo-b.csv`;
    downloadFile(filename, toCsv(headers, rows));
  }

  function exportDashboardCsv() {
    const metrics = calculateMetrics();
    const headers = ['N.º', 'Estudiante', 'Clases evaluadas', 'Notas registradas', 'Notas pendientes', 'Registro (%)', 'Rendimiento (%)'];
    const rows = metrics.studentMetrics.map((item, index) => [
      index + 1, item.name, item.evaluatedClasses, item.enteredGrades, item.pendingGrades,
      formatScore(item.completion), item.average === null ? 'Sin datos' : formatScore(item.average)
    ]);
    downloadFile('reporte-dashboard-general.csv', toCsv(headers, rows));
  }

  function exportChart(chart, filename) {
    if (!chart) return alert('La gráfica todavía no está disponible.');
    const link = document.createElement('a');
    link.download = filename;
    link.href = chart.toBase64Image('image/png', 1);
    link.click();
  }

  // ──────────────────────────────────────────────
  // EVENT BINDINGS
  // ──────────────────────────────────────────────

  function bindEvents() {
    // Tabs: Resumen ejecutivo, Test inicial, Test final
    byId('tabOverview')?.addEventListener('click', () => {
      currentTab = 'overview';
      renderDashboard();
    });

    byId('tabPre')?.addEventListener('click', () => {
      currentTab = 'pre';
      renderDashboard();
    });

    byId('tabPost')?.addEventListener('click', () => {
      currentTab = 'post';
      renderDashboard();
    });

    // Matrix Cell Changes (Delegated on container)
    document.addEventListener('change', (e) => {
      if (e.target.matches('input[data-matrix-q]')) {
        handleMatrixCellChange(e.target);
      }
    });

    // Matrix auto-select text on focus
    document.addEventListener('focusin', (e) => {
      if (e.target.matches('input[data-matrix-q]')) {
        e.target.select();
      }
    });

    // Search filters
    byId('searchPreMatrix')?.addEventListener('input', (e) => {
      searchPreFilter = e.target.value;
      const diag = getDiagnosticData();
      renderMatrixTable('pre', diag);
    });

    byId('searchPostMatrix')?.addEventListener('input', (e) => {
      searchPostFilter = e.target.value;
      const diag = getDiagnosticData();
      renderMatrixTable('post', diag);
    });

    // CSV Exports
    byId('exportPreMatrixCsv')?.addEventListener('click', () => exportMatrixCsv('pre'));
    byId('exportPostMatrixCsv')?.addEventListener('click', () => exportMatrixCsv('post'));
    byId('exportClassChart')?.addEventListener('click', () => exportChart(classChart, 'promedio-por-clase.png'));
    byId('exportDistributionChart')?.addEventListener('click', () => exportChart(distributionChart, 'distribucion-estudiantes.png'));
    byId('exportDashboardCsv')?.addEventListener('click', exportDashboardCsv);
  }

  async function init() {
    bindEvents();
    await AppStorage.init();
    renderDashboard();
  }

  return { init, renderDashboard };
})();

document.addEventListener('DOMContentLoaded', DashboardModule.init);
