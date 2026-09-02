/**
 * Report Logic and Visualizations Engine
 * Loads test results, renders comparative charts and per-question pie charts
 */

const ReportEngine = (() => {
  let reportData = null;
  const optionColors = {
    'A': '#3b82f6',
    'B': '#f97316',
    'C': '#10b981',
    'D': '#ef4444',
    'E': '#8b5cf6',
    '-': '#94a3b8',
    'NS': '#64748b',
    'NR': '#475569',
    'SI': '#10b981',
    'NO': '#ef4444',
    'MM': '#f59e0b'
  };

  async function loadData() {
    try {
      const res = await fetch('/api/test-results');
      if (!res.ok) throw new Error('No se pudo cargar /api/test-results');
      reportData = await res.json();
    } catch (e) {
      console.warn('Cargando datos locales de respaldo...', e);
      try {
        const resLocal = await fetch('../data/test_results_paralelo_b.json');
        reportData = await resLocal.json();
      } catch (err) {
        console.error('Error fatal al cargar datos:', err);
      }
    }
    return reportData;
  }

  function renderMetrics(data) {
    document.getElementById('totalStudentsVal').textContent = data.totalEnrolled;
    document.getElementById('preEvaluatedVal').textContent = `${data.summary.preTest.evaluated} (${Math.round((data.summary.preTest.evaluated / data.totalEnrolled) * 100)}%)`;
    document.getElementById('postEvaluatedVal').textContent = `${data.summary.postTest.evaluated} (${Math.round((data.summary.postTest.evaluated / data.totalEnrolled) * 100)}%)`;
    document.getElementById('preAverageVal').textContent = `${data.summary.preTest.average} / 10`;
    document.getElementById('postAverageVal').textContent = `${data.summary.postTest.average} / 10`;
    
    const delta = data.summary.paired.avgDelta;
    const sign = delta >= 0 ? '+' : '';
    const deltaEl = document.getElementById('deltaAverageVal');
    if (deltaEl) {
      deltaEl.textContent = `${sign}${delta} pts`;
      deltaEl.style.color = delta >= 0 ? '#16a34a' : '#dc2626';
    }
  }

  function renderComparativeBarChart(data) {
    const ctx = document.getElementById('comparativeBarChart');
    if (!ctx) return;

    const questions = Object.keys(data.questions);
    const prePercentages = questions.map(q => data.questions[q].pre.percentage);
    const postPercentages = questions.map(q => data.questions[q].post.percentage);

    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: questions,
        datasets: [
          {
            label: '% de correctas en Inicio (Pre-Test)',
            data: prePercentages,
            backgroundColor: '#0284c7',
            borderRadius: 6,
            barPercentage: 0.7,
            categoryPercentage: 0.7
          },
          {
            label: '% de correctas en Final (Post-Test)',
            data: postPercentages,
            backgroundColor: '#ea580c',
            borderRadius: 6,
            barPercentage: 0.7,
            categoryPercentage: 0.7
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              font: { family: 'Inter', size: 12, weight: '600' },
              padding: 16
            }
          },
          tooltip: {
            callbacks: {
              label: (context) => ` ${context.dataset.label}: ${context.raw}%`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: {
              callback: (val) => `${val}%`,
              font: { family: 'Inter' }
            },
            grid: {
              color: '#e2e8f0'
            }
          },
          x: {
            grid: { display: false },
            ticks: {
              font: { family: 'Inter', weight: '600' }
            }
          }
        }
      }
    });
  }

  function renderQuestionPieChart(canvasId, pieData, title) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const labels = pieData.map(item => `${item.label}: ${item.percentage}%`);
    const data = pieData.map(item => item.count);
    const bgColors = pieData.map(item => optionColors[item.label] || '#94a3b8');

    new Chart(canvas, {
      type: 'pie',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: bgColors,
          borderWidth: 1.5,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              boxWidth: 12,
              padding: 8,
              font: { family: 'Inter', size: 11 }
            }
          },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${ctx.label} (${ctx.raw} estudiantes)`
            }
          }
        }
      }
    });
  }

  function renderAllQuestionCharts(data) {
    Object.keys(data.questions).forEach(qKey => {
      const q = data.questions[qKey];
      renderQuestionPieChart(`pie_${qKey}_pre`, q.pre.pie, 'Prueba Inicial');
      renderQuestionPieChart(`pie_${qKey}_post`, q.post.pie, 'Prueba Final');
    });
  }

  function setupActions() {
    const printBtn = document.getElementById('btnPrintReport');
    if (printBtn) {
      printBtn.addEventListener('click', () => {
        window.print();
      });
    }

    const exportCsvBtn = document.getElementById('btnExportCsv');
    if (exportCsvBtn && reportData) {
      exportCsvBtn.addEventListener('click', () => {
        exportReportCsv(reportData);
      });
    }
  }

  function exportReportCsv(data) {
    const rows = [
      ['UNIDAD EDUCATIVA ENRIQUE LOPEZ LASCANO - 09H04773'],
      ['Reporte de Calificaciones de Test Computacional - Paralelo B (2025 - 2026)'],
      [''],
      ['No.', 'Cedula', 'Nombres Completos', 'Email', 'Pre-Test (10 pts)', 'Post-Test (10 pts)', 'Ganancia (Delta)']
    ];

    data.students.forEach(s => {
      rows.push([
        s.num,
        s.cedula || '',
        `"${s.name}"`,
        s.email || '',
        s.preTest.score !== null ? s.preTest.score : 'N/A',
        s.postTest.score !== null ? s.postTest.score : 'N/A',
        s.delta !== null ? s.delta : 'N/A'
      ]);
    });

    const csvContent = '\uFEFF' + rows.map(r => r.join(',')).join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'Reporte_Calificaciones_Paralelo_B.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  async function init() {
    const data = await loadData();
    if (!data) return;

    renderMetrics(data);
    renderComparativeBarChart(data);
    renderAllQuestionCharts(data);
    setupActions();
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', ReportEngine.init);
