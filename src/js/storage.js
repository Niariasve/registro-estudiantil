const AppStorage = (() => {
  const API_URL = '/api/data';

  const defaultColors = [
    '#2e7d32', '#00695c', '#0277bd', '#283593', '#6a1b9a', '#ad1457', '#d84315', '#4e342e', '#37474f'
  ];

  const defaultData = {
    selectedClassId: 'class-1',
    classes: [
      {
        id: 'class-1',
        name: 'Clase 1',
        code: 'PARALELO 1',
        term: 'I PAO 2026',
        color: '#2e7d32',
        activities: []
      }
    ],
    students: [],
    grades: {},
    diagnosticTests: {
      maxScore: 10,
      scores: {}
    }
  };

  let data = clone(defaultData);
  let persistQueue = Promise.resolve();

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  async function readJsonResponse(response) {
    const contentType = response.headers.get('content-type') || '';

    if (!contentType.includes('application/json')) {
      const text = await response.text();
      throw new Error(text || 'La API devolvió una respuesta inválida.');
    }

    return response.json();
  }

  async function init() {
    try {
      const response = await fetch(API_URL, { cache: 'no-store' });
      const result = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(result.error || 'No se pudo cargar la información.');
      }

      data = normalizeData(result);
    } catch (error) {
      console.error(error);
      alert(
        'No se pudo conectar con la base de datos. Revisa las variables de entorno y la función /api/data.'
      );
      data = clone(defaultData);
    }
  }

  function cleanText(value, fallback) {
    const text = String(value ?? '').trim();
    return text || fallback;
  }

  function normalizeData(value) {
    const input = value && typeof value === 'object' ? value : {};

    const classesSource = Array.isArray(input.classes)
      ? input.classes
      : clone(defaultData).classes;

    const classes = classesSource.map((classItem, index) => ({
      id: cleanText(classItem?.id, `class-${index + 1}`),
      name: cleanText(classItem?.name, `Clase ${index + 1}`),
      code: cleanText(classItem?.code, `PARALELO ${index + 1}`),
      term: cleanText(classItem?.term, 'I PAO 2026'),
      color: cleanText(classItem?.color, defaultColors[index % defaultColors.length]),
      activities: Array.isArray(classItem?.activities)
        ? classItem.activities.map((act, actIndex) => {
            const maxScore = Number(act?.maxScore);
            return {
              id: cleanText(act?.id, `activity-${index + 1}-${actIndex + 1}`),
              name: cleanText(act?.name, `Actividad ${actIndex + 1}`),
              maxScore: Number.isFinite(maxScore) && maxScore >= 0 ? maxScore : 0
            };
          })
        : []
    }));

    const students = Array.isArray(input.students)
      ? input.students.map((student, index) => ({
          id: cleanText(student?.id, `student-${index + 1}`),
          name: cleanText(student?.name, `Estudiante ${index + 1}`)
        }))
      : [];

    const studentIds = new Set(students.map((s) => s.id));

    const selectedClassId = classes.some((item) => item.id === input.selectedClassId)
      ? input.selectedClassId
      : classes[0]?.id ?? null;

    const grades = input.grades && typeof input.grades === 'object' && !Array.isArray(input.grades)
      ? { ...input.grades }
      : {};

    const rawDiag = input.diagnosticTests && typeof input.diagnosticTests === 'object'
      ? input.diagnosticTests
      : {};
    const diagMax = Number(rawDiag.maxScore);
    const validDiagMax = Number.isFinite(diagMax) && diagMax > 0 ? diagMax : 10;
    const diagScores = {};

    if (rawDiag.scores && typeof rawDiag.scores === 'object') {
      Object.entries(rawDiag.scores).forEach(([studentId, item]) => {
        if (!studentIds.has(studentId)) return;
        if (!item || typeof item !== 'object') return;

        const pre = item.pre !== undefined && item.pre !== null && item.pre !== '' ? Number(item.pre) : null;
        const post = item.post !== undefined && item.post !== null && item.post !== '' ? Number(item.post) : null;

        diagScores[studentId] = {
          pre: Number.isFinite(pre) && pre >= 0 ? Math.min(pre, validDiagMax) : null,
          post: Number.isFinite(post) && post >= 0 ? Math.min(post, validDiagMax) : null
        };
      });
    }

    return {
      selectedClassId,
      classes,
      students,
      grades,
      diagnosticTests: {
        maxScore: validDiagMax,
        scores: diagScores
      }
    };
  }

  function persistNow() {
    const payload = clone(data);

    const operation = persistQueue.catch(() => undefined).then(async () => {
      const response = await fetch(API_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(result.error || 'No se pudieron guardar los cambios.');
      }

      data = normalizeData(result);
      return data;
    });

    persistQueue = operation;
    return operation;
  }

  function getData() {
    return data;
  }

  function snapshot() {
    return clone(data);
  }

  function replaceData(nextData) {
    data = normalizeData(nextData);
  }

  function selectedClass() {
    return (
      data.classes.find((item) => item.id === data.selectedClassId) || null
    );
  }

  function setSelectedClass(classId) {
    if (data.classes.some((item) => item.id === classId)) {
      data.selectedClassId = classId;
    }
  }

  return {
    getData,
    init,
    persistNow,
    replaceData,
    selectedClass,
    setSelectedClass,
    snapshot
  };
})();
