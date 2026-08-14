import { createClient } from '@supabase/supabase-js';

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

let supabaseClient = null;

function getSupabase() {
  const supabaseUrl = process.env.SUPABASE_URL;

  const supabaseSecretKey =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseSecretKey) {
    throw new Error(
      'Faltan SUPABASE_URL y SUPABASE_SECRET_KEY en las variables de entorno.'
    );
  }

  if (!supabaseClient) {
    supabaseClient = createClient(
      supabaseUrl,
      supabaseSecretKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false
        }
      }
    );
  }

  return supabaseClient;
}

function jsonResponse(payload, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...extraHeaders
    }
  });
}

function cleanText(value, fallback) {
  const text = String(value ?? '').trim();
  return text || fallback;
}

function normalizeData(value) {
  const input =
    value && typeof value === 'object'
      ? value
      : {};

  const classesSource = Array.isArray(input.classes)
    ? input.classes
    : defaultData.classes;

  const classes = classesSource.map(
    (classItem, classIndex) => ({
      id: cleanText(
        classItem?.id,
        `class-${classIndex + 1}`
      ),

      name: cleanText(
        classItem?.name,
        `Clase ${classIndex + 1}`
      ),

      code: cleanText(
        classItem?.code,
        `PARALELO ${classIndex + 1}`
      ),

      term: cleanText(
        classItem?.term,
        'I PAO 2026'
      ),

      color: cleanText(
        classItem?.color,
        defaultColors[classIndex % defaultColors.length]
      ),

      activities: Array.isArray(
        classItem?.activities
      )
        ? classItem.activities.map(
            (activity, activityIndex) => {
              const maxScore = Number(
                activity?.maxScore
              );

              return {
                id: cleanText(
                  activity?.id,
                  `activity-${classIndex + 1}-${activityIndex + 1}`
                ),

                name: cleanText(
                  activity?.name,
                  `Actividad ${activityIndex + 1}`
                ),

                maxScore:
                  Number.isFinite(maxScore) &&
                  maxScore >= 0
                    ? maxScore
                    : 0
              };
            }
          )
        : []
    })
  );

  const students = Array.isArray(input.students)
    ? input.students.map((student, index) => ({
        id: cleanText(
          student?.id,
          `student-${index + 1}`
        ),

        name: cleanText(
          student?.name,
          `Estudiante ${index + 1}`
        )
      }))
    : [];

  const selectedClassId = classes.some(
    (classItem) =>
      classItem.id === input.selectedClassId
  )
    ? input.selectedClassId
    : classes[0]?.id ?? null;

  const activityMaxById = new Map();

  classes.forEach((classItem) => {
    classItem.activities.forEach((activity) => {
      activityMaxById.set(
        activity.id,
        Number(activity.maxScore)
      );
    });
  });

  const studentIds = new Set(
    students.map((student) => student.id)
  );

  const grades = {};

  const sourceGrades =
    input.grades &&
    typeof input.grades === 'object' &&
    !Array.isArray(input.grades)
      ? input.grades
      : {};

  Object.entries(sourceGrades).forEach(
    ([key, rawValue]) => {
      const separatorIndex = key.indexOf(':');

      if (separatorIndex < 1) return;

      const studentId = key.slice(
        0,
        separatorIndex
      );

      const activityId = key.slice(
        separatorIndex + 1
      );

      const score = Number(rawValue);
      const maxScore =
        activityMaxById.get(activityId);

      if (!studentIds.has(studentId)) return;
      if (maxScore === undefined) return;

      if (
        !Number.isFinite(score) ||
        score < 0
      ) {
        return;
      }

      grades[key] = Math.min(
        score,
        maxScore
      );
    }
  );

  const rawDiag = input.diagnosticTests && typeof input.diagnosticTests === 'object' ? input.diagnosticTests : {};
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

async function loadState() {
  const supabase = getSupabase();

  const { data: row, error } = await supabase
    .from('app_state')
    .select('data')
    .eq('id', 'main')
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (row?.data) {
    return normalizeData(row.data);
  }

  const initialData = normalizeData(
    defaultData
  );

  const { error: insertError } = await supabase
    .from('app_state')
    .insert({
      id: 'main',
      data: initialData
    });

  if (insertError) {
    throw insertError;
  }

  return initialData;
}

async function saveState(input) {
  const supabase = getSupabase();
  const normalizedData = normalizeData(input);

  const { data: row, error } = await supabase
    .from('app_state')
    .upsert(
      {
        id: 'main',
        data: normalizedData,
        updated_at: new Date().toISOString()
      },
      {
        onConflict: 'id'
      }
    )
    .select('data')
    .single();

  if (error) {
    throw error;
  }

  return normalizeData(row.data);
}

export default {
  async fetch(request) {
    try {
      if (request.method === 'GET') {
        const data = await loadState();

        return jsonResponse(data);
      }

      if (request.method === 'PUT') {
        let body;

        try {
          body = await request.json();
        } catch {
          return jsonResponse(
            {
              error:
                'El cuerpo de la petición no contiene un JSON válido.'
            },
            400
          );
        }

        const data = await saveState(body);

        return jsonResponse(data);
      }

      return jsonResponse(
        {
          error: 'Método no permitido.'
        },
        405,
        {
          Allow: 'GET, PUT'
        }
      );
    } catch (error) {
      console.error(
        'Error en /api/data:',
        error
      );

      return jsonResponse(
        {
          error:
            error?.message ||
            'No se pudieron procesar los datos.'
        },
        500
      );
    }
  }
};