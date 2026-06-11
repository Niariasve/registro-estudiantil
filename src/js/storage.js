const AppStorage = (() => {
  const API_URL = '/api/data';

  const defaultData = {
    selectedClassId: 'class-1',
    classes: [{ id: 'class-1', name: 'Clase 1', activities: [] }],
    students: [],
    grades: {}
  };

  let data = cloneDefaultData();
  let saveTimer = null;

  function cloneDefaultData() {
    return JSON.parse(JSON.stringify(defaultData));
  }

  async function init() {
    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error('No se pudo cargar la base de datos.');
      data = normalizeData(await response.json());
    } catch {
      alert('No se pudo conectar con la base de datos local. Ejecutá npm start y abrí http://localhost:3000.');
      data = cloneDefaultData();
    }
  }

  function normalizeData(value) {
    const normalized = {
      selectedClassId: value.selectedClassId || defaultData.selectedClassId,
      classes: Array.isArray(value.classes) && value.classes.length ? value.classes : cloneDefaultData().classes,
      students: Array.isArray(value.students) ? value.students : [],
      grades: value.grades && typeof value.grades === 'object' ? value.grades : {}
    };

    if (!normalized.classes.some((classItem) => classItem.id === normalized.selectedClassId)) {
      normalized.selectedClassId = normalized.classes[0].id;
    }

    normalized.classes.forEach((classItem) => {
      if (!Array.isArray(classItem.activities)) classItem.activities = [];
    });

    return normalized;
  }

  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      persistNow().catch(() => {
        alert('No se pudieron guardar los cambios en la base de datos local.');
      });
    }, 150);
  }

  async function persistNow() {
    clearTimeout(saveTimer);
    const response = await fetch(API_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('No se pudieron guardar los cambios.');
    data = normalizeData(await response.json());
  }

  function getData() {
    return data;
  }

  function selectedClass() {
    return data.classes.find((item) => item.id === data.selectedClassId) || data.classes[0];
  }

  function setSelectedClass(classId) {
    if (data.classes.some((item) => item.id === classId)) {
      data.selectedClassId = classId;
      save();
    }
  }

  function replaceData(nextData) {
    data = normalizeData(nextData);
    save();
  }

  return { getData, init, persistNow, replaceData, save, selectedClass, setSelectedClass };
})();
