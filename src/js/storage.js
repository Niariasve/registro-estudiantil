const AppStorage = (() => {
  const API_URL = '/api/data';

  const defaultData = {
    selectedClassId: 'class-1',
    classes: [{ id: 'class-1', name: 'Clase 1', activities: [] }],
    students: [],
    grades: {}
  };

  let data = cloneDefaultData();
  let lastSavedData = cloneDefaultData();
  let saveTimer = null;
  let isFirebase = false;
  let db = null;
  let firebaseInitialized = false;
  let unsubscribes = [];

  // Bandera para suspender actualizaciones desde listeners durante mutaciones
  let isMutating = false;

  function cloneDefaultData() {
    return JSON.parse(JSON.stringify(defaultData));
  }

  function cloneData(source) {
    return JSON.parse(JSON.stringify(source));
  }

  function getFirebaseConfig() {
    if (typeof firebaseConfig !== 'undefined' && firebaseConfig && firebaseConfig.projectId && firebaseConfig.projectId !== 'TU_PROJECT_ID') {
      return firebaseConfig;
    }
    return null;
  }

  async function init() {
    const config = getFirebaseConfig();
    if (config) {
      try {
        isFirebase = true;
        await initFirebase(config);
        return;
      } catch (err) {
        console.error("Firebase init error, falling back to local:", err);
      }
    }

    isFirebase = false;
    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error('No se pudo cargar la base de datos.');
      data = normalizeData(await response.json());
      lastSavedData = cloneData(data);
    } catch {
      data = cloneDefaultData();
      lastSavedData = cloneData(data);
    }
  }

  function initFirebase(config) {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error("Tiempo de espera agotado al conectar con Firebase."));
      }, 8000);

      let resolved = false;

      try {
        if (!firebaseInitialized) {
          firebase.initializeApp(config);
          firebaseInitialized = true;
        }
        db = firebase.firestore();

        // Cache de lo que llega de Firestore en tiempo real
        let liveStudents = null;
        let liveClasses = null;
        let liveGrades = null;
        let liveConfig = null;

        function mergeAndRender() {
          // Si estamos en medio de una operación de escritura, ignorar actualizaciones de Firestore
          if (isMutating) return;

          if (liveStudents === null || liveClasses === null || liveGrades === null || liveConfig === null) {
            return;
          }

          if (!resolved) {
            clearTimeout(timeoutId);
          }

          const newData = {
            selectedClassId: liveConfig.selectedClassId || (liveClasses[0] ? liveClasses[0].id : null),
            classes: liveClasses,
            students: liveStudents,
            grades: liveGrades
          };

          const normalized = normalizeData(newData);

          if (JSON.stringify(data) !== JSON.stringify(normalized)) {
            data = normalized;
            // IMPORTANTE: lastSavedData solo se actualiza en el primer cargado,
            // después solo en syncToFirestore. Así detectamos cambios locales correctamente.
            if (!resolved) {
              lastSavedData = cloneData(data);
            }
            if (window.App && typeof App.render === 'function') {
              App.render();
            }
          }

          if (!resolved) {
            resolved = true;
            resolve();
          }
        }

        unsubscribes.forEach(unsub => unsub());
        unsubscribes = [];

        // 1. Students
        unsubscribes.push(
          db.collection('students').onSnapshot(snapshot => {
            const studentsList = [];
            snapshot.forEach(doc => {
              const d = doc.data();
              studentsList.push({ id: doc.id, name: d.name, createdAt: d.createdAt || 0 });
            });
            studentsList.sort((a, b) => a.createdAt - b.createdAt);
            liveStudents = studentsList;
            mergeAndRender();
          }, err => {
            console.error("Firestore students error:", err);
            if (!resolved) { clearTimeout(timeoutId); reject(err); }
          })
        );

        // 2. Classes
        unsubscribes.push(
          db.collection('classes').onSnapshot(snapshot => {
            const classesList = [];
            snapshot.forEach(doc => {
              const d = doc.data();
              classesList.push({
                id: doc.id,
                name: d.name,
                activities: d.activities || [],
                createdAt: d.createdAt || 0
              });
            });
            classesList.sort((a, b) => a.createdAt - b.createdAt);
            liveClasses = classesList;
            mergeAndRender();
          }, err => {
            console.error("Firestore classes error:", err);
            if (!resolved) { clearTimeout(timeoutId); reject(err); }
          })
        );

        // 3. Grades
        unsubscribes.push(
          db.collection('grades').onSnapshot(snapshot => {
            const gradesMap = {};
            snapshot.forEach(doc => {
              const d = doc.data();
              if (d && d.studentId && d.activityId) {
                gradesMap[`${d.studentId}:${d.activityId}`] = d.value;
              }
            });
            liveGrades = gradesMap;
            mergeAndRender();
          }, err => {
            console.error("Firestore grades error:", err);
            if (!resolved) { clearTimeout(timeoutId); reject(err); }
          })
        );

        // 4. Config
        unsubscribes.push(
          db.collection('config').doc('global').onSnapshot(doc => {
            liveConfig = doc.exists ? doc.data() : { selectedClassId: null };
            mergeAndRender();
          }, err => {
            console.error("Firestore config error:", err);
            if (!resolved) { clearTimeout(timeoutId); reject(err); }
          })
        );

      } catch (err) {
        clearTimeout(timeoutId);
        reject(err);
      }
    });
  }

  function normalizeData(value) {
    const input = value && typeof value === 'object' ? value : {};
    const normalized = {
      selectedClassId: input.selectedClassId || null,
      classes: Array.isArray(input.classes) ? input.classes : [],
      students: Array.isArray(input.students) ? input.students : [],
      grades: input.grades && typeof input.grades === 'object' ? input.grades : {}
    };

    if (normalized.classes.length && !normalized.classes.some(c => c.id === normalized.selectedClassId)) {
      normalized.selectedClassId = normalized.classes[0].id;
    }

    normalized.classes.forEach(c => {
      if (!Array.isArray(c.activities)) c.activities = [];
    });

    return normalized;
  }

  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      persistNow().catch(err => console.error("Persist error:", err));
    }, 150);
  }

  async function persistNow() {
    clearTimeout(saveTimer);
    if (isFirebase) {
      await syncToFirestore();
    } else {
      const response = await fetch(API_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('No se pudieron guardar los cambios.');
      data = normalizeData(await response.json());
      lastSavedData = cloneData(data);
    }
  }

  async function syncToFirestore() {
    if (!db) return;

    const batch = db.batch();
    let hasOps = false;

    const curStudentsMap = new Map(data.students.map(s => [s.id, s]));
    const lastStudentsMap = new Map(lastSavedData.students.map(s => [s.id, s]));

    for (const [id, s] of curStudentsMap) {
      const lastS = lastStudentsMap.get(id);
      if (!lastS || lastS.name !== s.name) {
        batch.set(db.collection('students').doc(id), {
          name: s.name,
          createdAt: s.createdAt || Date.now()
        }, { merge: true });
        hasOps = true;
      }
    }
    for (const [id] of lastStudentsMap) {
      if (!curStudentsMap.has(id)) {
        batch.delete(db.collection('students').doc(id));
        hasOps = true;
      }
    }

    const curClassesMap = new Map(data.classes.map(c => [c.id, c]));
    const lastClassesMap = new Map(lastSavedData.classes.map(c => [c.id, c]));

    for (const [id, c] of curClassesMap) {
      const lastC = lastClassesMap.get(id);
      if (!lastC || JSON.stringify(lastC.activities) !== JSON.stringify(c.activities) || lastC.name !== c.name) {
        batch.set(db.collection('classes').doc(id), {
          name: c.name,
          activities: c.activities,
          createdAt: c.createdAt || Date.now()
        }, { merge: true });
        hasOps = true;
      }
    }
    for (const [id] of lastClassesMap) {
      if (!curClassesMap.has(id)) {
        batch.delete(db.collection('classes').doc(id));
        hasOps = true;
      }
    }

    const curGrades = data.grades;
    const lastGrades = lastSavedData.grades;

    for (const [key, val] of Object.entries(curGrades)) {
      if (lastGrades[key] !== val) {
        const [studentId, activityId] = key.split(':');
        batch.set(db.collection('grades').doc(`${studentId}_${activityId}`), {
          studentId, activityId,
          value: val === '' ? '' : Number(val),
          classId: getClassIdForActivity(activityId)
        });
        hasOps = true;
      }
    }
    for (const key of Object.keys(lastGrades)) {
      if (!(key in curGrades)) {
        const [studentId, activityId] = key.split(':');
        batch.delete(db.collection('grades').doc(`${studentId}_${activityId}`));
        hasOps = true;
      }
    }

    if (data.selectedClassId !== lastSavedData.selectedClassId) {
      batch.set(db.collection('config').doc('global'), { selectedClassId: data.selectedClassId }, { merge: true });
      hasOps = true;
    }

    if (hasOps) {
      await batch.commit();
    }
    lastSavedData = cloneData(data);
  }

  // Eliminar clase directamente en Firestore con bandera isMutating
  async function deleteClassFromFirestore(classId) {
    if (!db) return;

    // Pausar listeners para que no restauren datos durante el borrado
    isMutating = true;
    try {
      const batchOps = db.batch();
      batchOps.delete(db.collection('classes').doc(classId));

      // Borrar notas de esta clase
      const gradesSnap = await db.collection('grades').get();
      gradesSnap.forEach(doc => {
        const d = doc.data();
        if (d && d.classId === classId) {
          batchOps.delete(doc.ref);
        }
      });

      await batchOps.commit();
      lastSavedData = cloneData(data);
    } finally {
      isMutating = false;
    }
  }

  // Eliminar estudiante directamente en Firestore con bandera isMutating
  async function deleteStudentFromFirestore(studentId) {
    if (!db) return;

    isMutating = true;
    try {
      const batchOps = db.batch();
      batchOps.delete(db.collection('students').doc(studentId));

      const gradesSnap = await db.collection('grades').get();
      gradesSnap.forEach(doc => {
        const d = doc.data();
        if (d && d.studentId === studentId) {
          batchOps.delete(doc.ref);
        }
      });

      await batchOps.commit();
      lastSavedData = cloneData(data);
    } finally {
      isMutating = false;
    }
  }

  function getClassIdForActivity(activityId) {
    const cls = data.classes.find(c => c.activities.some(a => a.id === activityId));
    return cls ? cls.id : '';
  }

  function isFirebaseActive() {
    return isFirebase;
  }

  function getData() {
    return data;
  }

  function selectedClass() {
    return data.classes.find(item => item.id === data.selectedClassId) || data.classes[0];
  }

  function setSelectedClass(classId) {
    if (data.classes.some(item => item.id === classId)) {
      data.selectedClassId = classId;
      save();
    }
  }

  function replaceData(nextData) {
    data = normalizeData(nextData);
    save();
  }

  return {
    deleteClassFromFirestore,
    deleteStudentFromFirestore,
    getData,
    init,
    isFirebaseActive,
    persistNow,
    replaceData,
    save,
    selectedClass,
    setSelectedClass
  };
})();
