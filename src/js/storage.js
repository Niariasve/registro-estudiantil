const AppStorage = (() => {
  const API_URL = '/api/data';

  const defaultData = {
    selectedClassId: 'class-1',
    classes: [{ id: 'class-1', name: 'Clase 1', activities: [] }],
    students: [],
    grades: {}
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

  function normalizeData(value) {
    const input = value && typeof value === 'object' ? value : {};

    const normalized = {
      selectedClassId: input.selectedClassId ?? null,
      classes: Array.isArray(input.classes)
        ? input.classes
        : clone(defaultData).classes,
      students: Array.isArray(input.students) ? input.students : [],
      grades:
        input.grades && typeof input.grades === 'object' && !Array.isArray(input.grades)
          ? input.grades
          : {}
    };

    normalized.classes.forEach((classItem) => {
      if (!Array.isArray(classItem.activities)) classItem.activities = [];
    });

    const selectedExists = normalized.classes.some(
      (classItem) => classItem.id === normalized.selectedClassId
    );

    if (!selectedExists) {
      normalized.selectedClassId = normalized.classes[0]?.id ?? null;
    }

    return normalized;
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
