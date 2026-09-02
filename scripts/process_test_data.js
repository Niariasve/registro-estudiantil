import { readFileSync, writeFileSync } from 'fs';
import * as XLSX from 'xlsx';
import path from 'path';

const filePath = path.resolve('Copia de Test Computacional PAOI 2026 - Paralelo B (5) (1).xlsx');
const buf = readFileSync(filePath);
const workbook = XLSX.read(buf, { type: 'buffer' });

const listSheet = workbook.Sheets['01_lista_jornada_anio_paralelo'];
const listData = XLSX.utils.sheet_to_json(listSheet, { header: 1 });

const preSheet = workbook.Sheets['Notas primera evaluación'];
const preData = XLSX.utils.sheet_to_json(preSheet, { header: 1 });

const postSheet = workbook.Sheets['Notas evaluación final'];
const postData = XLSX.utils.sheet_to_json(postSheet, { header: 1 });

const key = {
  P4: 'C', P5: 'C', P6: 'C', P7: 'B', P8: 'B', P9: 'B', P10: 'B', P11: 'A', P12: 'B', P13: 'B', P14: 'C'
};
const qCols = ['P4', 'P5', 'P6', 'P7', 'P8', 'P9', 'P10', 'P11', 'P12', 'P13', 'P14'];

// Questions metadata
const questionsMeta = {
  P4: {
    num: 4,
    title: '¿Cuál de las siguientes opciones es un ejemplo de software?',
    topic: 'Concepto de Software',
    key: 'C',
    keyText: 'C) Microsoft Word',
    options: {
      A: 'A) Monitor',
      B: 'B) Teclado',
      C: 'C) Microsoft Word',
      D: 'D) Cable de poder',
      E: 'E) No sé'
    }
  },
  P5: {
    num: 5,
    title: '¿Cuál de las siguientes opciones es un ejemplo de hardware?',
    topic: 'Concepto de Hardware',
    key: 'C',
    keyText: 'C) Teclado',
    options: {
      A: 'A) Microsoft Word',
      B: 'B) Internet',
      C: 'C) Teclado',
      D: 'D) Archivo pdf',
      E: 'E) No sé'
    }
  },
  P6: {
    num: 6,
    title: '¿Qué tienen en común los objetos de la figura?',
    topic: 'Identificación de patrones y características comunes',
    key: 'C',
    keyText: 'C. Se usan cuando llueve',
    options: {
      A: 'A. Se usan cuando hace frío',
      B: 'B. Son para jugar fútbol',
      C: 'C. Se usan cuando llueve'
    }
  },
  P7: {
    num: 7,
    title: 'Si quisieras dibujar una casa de forma muy simple, ¿cuál dibujo seleccionarías?',
    topic: 'Abstracción y representación simple',
    key: 'B',
    keyText: 'B) Casa esquemática simple',
    options: {
      A: 'A) Casa detallada',
      B: 'B) Casa esquemática simple',
      C: 'C) Cuadrado simple'
    }
  },
  P8: {
    num: 8,
    title: 'Selecciona el orden correcto de los pasos para que Bruce Wayne se ponga su traje de Batman.',
    topic: 'Algoritmos y descomposición de procesos',
    key: 'B',
    keyText: 'B. Traje – Cinturón– Capa',
    options: {
      A: 'A. Cinturón– Capa– Traje',
      B: 'B. Traje – Cinturón– Capa',
      C: 'C. Capa – Cinturón – Traje'
    }
  },
  P9: {
    num: 9,
    title: 'Marca la figura que debe ir en la siguiente secuencia / ¿Qué animal no sigue el patrón?',
    topic: 'Reconocimiento de patrones y secuencias lógicas',
    key: 'B',
    keyText: 'B) Triángulo / Jirafa',
    options: {
      A: 'A) Rombo / Vaca',
      B: 'B) Triángulo / Jirafa',
      C: 'C) Cuadrado / Cebra',
      D: 'D) Oso panda / Otra opción'
    }
  },
  P10: {
    num: 10,
    title: '¿Cuál número crees que va en el espacio vacío para completar la secuencia? 2 → 4 → 6 → 8 → (?) → 12',
    topic: 'Secuencias numéricas',
    key: 'B',
    keyText: 'B. 10',
    options: {
      A: 'A. 9',
      B: 'B. 10',
      C: 'C. 11'
    }
  },
  P11: {
    num: 11,
    title: 'Observa los pasos para cepillarte los dientes. Encierra la figura que completa correctamente la secuencia.',
    topic: 'Secuencias de procesos cotidianos',
    key: 'A',
    keyText: 'A) Cepillarse los dientes',
    options: {
      A: 'A) Cepillarse los dientes',
      B: 'B) Utilizar el hilo dental',
      C: 'C) Utilizar el enjuague bucal'
    }
  },
  P12: {
    num: 12,
    title: 'Indica los pasos para preparar un sánduche de jamón y queso.',
    topic: 'Creación de algoritmos paso a paso',
    key: 'B',
    keyText: 'B) Algoritmo correcto (1-Pan, 2-Jamón y queso, 3-Pan)',
    options: {
      B: 'Correcto (Pasos ordenados)',
      '-': 'Incorrecto / Incompleto / No contestó'
    }
  },
  P13: {
    num: 13,
    title: 'Un niño dice: "Si hace sol, juego afuera. Si llueve, leo un libro." ¿Qué hará el niño si llueve?',
    topic: 'Pensamiento lógico y condicionales (If/Else)',
    key: 'B',
    keyText: 'B. Leer un libro',
    options: {
      A: 'A. Jugar afuera',
      B: 'B. Leer un libro',
      C: 'C. Ver TV',
      D: 'D. Dormir'
    }
  },
  P14: {
    num: 14,
    title: 'Imagina que estás en el punto marcado con la flecha. ¿Qué figura dibujará la siguiente instrucción? Repetir 4 veces: Caminar 5 pasos hacia adelante, Girar a la derecha',
    topic: 'Bucles (repeticiones) y orientación espacial',
    key: 'C',
    keyText: 'C. Cuadrado',
    options: {
      A: 'A. Círculo',
      B: 'B. Triángulo',
      C: 'C. Cuadrado',
      D: 'D. Línea recta',
      E: 'E. No sé'
    }
  }
};

// Parse 42 students
const studentsList = [];
for (let r = 5; r <= 46; r++) {
  const row = listData[r];
  if (!row) continue;
  let num = row[0] || (r - 4);
  let cedula = row[1] || null;
  let name = row[3] ? String(row[3]).trim() : '';
  let email = row[7] ? String(row[7]).trim() : '';
  
  if (!name && row[4]) name = String(row[4]).trim();

  // If cells shifted
  for (let c = 0; c < row.length; c++) {
    const val = row[c];
    if (typeof val === 'number' && val >= 1 && val <= 45 && !num) num = val;
    if (typeof val === 'string' && val.includes('@')) email = val.trim();
    if (typeof val === 'string' && val.trim().length > 3 && !val.includes('@') && !val.includes('UNIDAD') && !val.includes('OJO') && isNaN(Number(val))) {
      name = val.trim();
    }
    if ((typeof val === 'number' || (typeof val === 'string' && /^\d+$/.test(val))) && String(val).length >= 9) {
      cedula = String(val);
    }
  }

  studentsList.push({
    num: studentsList.length + 1,
    id: `student-pb-${String(studentsList.length + 1).padStart(2, '0')}`,
    name,
    cedula: cedula || '',
    email: email || ''
  });
}

console.log(`Parsed ${studentsList.length} students.`);

// Parse Pre-Test
const preByStudent = {};
for (let r = 4; r < preData.length; r++) {
  const row = preData[r];
  if (!row || !row[0]) continue;
  const name = String(row[0]).trim();
  if (name === 'NOMBRES COMPLETOS' || name.startsWith('PROMEDIO')) continue;

  const answers = {};
  let correct = 0;
  let attempted = false;
  qCols.forEach((q, i) => {
    const raw = row[7 + i];
    let v = raw !== undefined && raw !== null ? String(raw).trim().toUpperCase() : '-';
    if (v === 'M') v = '-'; // standardise M to -
    answers[q] = v;
    if (v !== '-' && v !== '') attempted = true;
    if (v === key[q]) correct++;
  });

  const p1 = row[4] ? String(row[4]).trim().toUpperCase() : '-';
  const p2 = row[5] ? String(row[5]).trim().toUpperCase() : '-';
  const p3 = row[6] ? String(row[6]).trim().toUpperCase() : '-';

  const score = attempted ? Math.round((correct / 11) * 10 * 100) / 100 : null;
  preByStudent[name] = {
    name,
    answers,
    perception: { P1: p1, P2: p2, P3: p3 },
    correct,
    score,
    attempted
  };
}

// Parse Post-Test
const postByStudent = {};
for (let r = 4; r < postData.length; r++) {
  const row = postData[r];
  if (!row || !row[0]) continue;
  const name = String(row[0]).trim();
  if (name === 'NOMBRES COMPLETOS' || name.startsWith('PROMEDIO')) continue;

  const answers = {};
  let correct = 0;
  let attempted = false;
  qCols.forEach((q, i) => {
    const raw = row[7 + i];
    let v = raw !== undefined && raw !== null ? String(raw).trim().toUpperCase() : '-';
    if (v === 'M') v = '-';
    answers[q] = v;
    if (v !== '-' && v !== '') attempted = true;
    if (v === key[q]) correct++;
  });

  const p1 = row[4] ? String(row[4]).trim().toUpperCase() : '-';
  const p2 = row[5] ? String(row[5]).trim().toUpperCase() : '-';
  const p3 = row[6] ? String(row[6]).trim().toUpperCase() : '-';

  const score = attempted ? Math.round((correct / 11) * 10 * 100) / 100 : null;
  postByStudent[name] = {
    name,
    answers,
    perception: { P1: p1, P2: p2, P3: p3 },
    correct,
    score,
    attempted
  };
}

// Combine all
const fullStudentData = studentsList.map(st => {
  const pre = preByStudent[st.name] || { answers: {}, perception: {}, correct: 0, score: null, attempted: false };
  const post = postByStudent[st.name] || { answers: {}, perception: {}, correct: 0, score: null, attempted: false };

  const delta = (pre.score !== null && post.score !== null) ? Math.round((post.score - pre.score) * 100) / 100 : null;

  return {
    ...st,
    preTest: {
      attempted: pre.attempted,
      score: pre.score,
      correct: pre.correct,
      answers: pre.answers,
      perception: pre.perception
    },
    postTest: {
      attempted: post.attempted,
      score: post.score,
      correct: post.correct,
      answers: post.answers,
      perception: post.perception
    },
    delta
  };
});

// Calculate statistics
const preEvaluated = fullStudentData.filter(s => s.preTest.attempted && s.preTest.score !== null);
const postEvaluated = fullStudentData.filter(s => s.postTest.attempted && s.postTest.score !== null);
const pairedEvaluated = fullStudentData.filter(s => s.preTest.attempted && s.postTest.attempted);

const avgPre = preEvaluated.reduce((acc, s) => acc + s.preTest.score, 0) / preEvaluated.length;
const avgPost = postEvaluated.reduce((acc, s) => acc + s.postTest.score, 0) / postEvaluated.length;

const avgPrePaired = pairedEvaluated.reduce((acc, s) => acc + s.preTest.score, 0) / pairedEvaluated.length;
const avgPostPaired = pairedEvaluated.reduce((acc, s) => acc + s.postTest.score, 0) / pairedEvaluated.length;
const avgDeltaPaired = avgPostPaired - avgPrePaired;

// Per-question stats and distributions
const questionsStats = {};
qCols.forEach(q => {
  const meta = questionsMeta[q];
  const preDist = {};
  const postDist = {};
  let preCorrectCount = 0;
  let postCorrectCount = 0;

  preEvaluated.forEach(s => {
    const ans = s.preTest.answers[q] || '-';
    preDist[ans] = (preDist[ans] || 0) + 1;
    if (ans === meta.key) preCorrectCount++;
  });

  postEvaluated.forEach(s => {
    const ans = s.postTest.answers[q] || '-';
    postDist[ans] = (postDist[ans] || 0) + 1;
    if (ans === meta.key) postCorrectCount++;
  });

  const prePct = (preCorrectCount / preEvaluated.length) * 100;
  const postPct = (postCorrectCount / postEvaluated.length) * 100;
  const diffPct = postPct - prePct;

  // Pie chart data formatting
  const prePie = Object.entries(preDist).map(([label, count]) => ({
    label,
    count,
    percentage: Math.round((count / preEvaluated.length) * 10000) / 100
  }));

  const postPie = Object.entries(postDist).map(([label, count]) => ({
    label,
    count,
    percentage: Math.round((count / postEvaluated.length) * 10000) / 100
  }));

  questionsStats[q] = {
    ...meta,
    pre: {
      evaluated: preEvaluated.length,
      correctCount: preCorrectCount,
      percentage: Math.round(prePct * 100) / 100,
      distribution: preDist,
      pie: prePie
    },
    post: {
      evaluated: postEvaluated.length,
      correctCount: postCorrectCount,
      percentage: Math.round(postPct * 100) / 100,
      distribution: postDist,
      pie: postPie
    },
    diff: Math.round(diffPct * 100) / 100
  };
});

const reportData = {
  institution: 'UNIDAD EDUCATIVA ENRIQUE LOPEZ LASCANO - 09H04773',
  period: '2025 - 2026',
  parallel: 'PARALELO B',
  course: 'Pensamiento Computacional PAOI 2026',
  totalEnrolled: fullStudentData.length,
  summary: {
    preTest: {
      evaluated: preEvaluated.length,
      average: Math.round(avgPre * 100) / 100,
      minScore: Math.min(...preEvaluated.map(s => s.preTest.score)),
      maxScore: Math.max(...preEvaluated.map(s => s.preTest.score))
    },
    postTest: {
      evaluated: postEvaluated.length,
      average: Math.round(avgPost * 100) / 100,
      minScore: Math.min(...postEvaluated.map(s => s.postTest.score)),
      maxScore: Math.max(...postEvaluated.map(s => s.postTest.score))
    },
    paired: {
      count: pairedEvaluated.length,
      avgPre: Math.round(avgPrePaired * 100) / 100,
      avgPost: Math.round(avgPostPaired * 100) / 100,
      avgDelta: Math.round(avgDeltaPaired * 100) / 100
    }
  },
  questions: questionsStats,
  students: fullStudentData
};

writeFileSync('data/test_results_paralelo_b.json', JSON.stringify(reportData, null, 2), 'utf8');
console.log('Saved data/test_results_paralelo_b.json successfully!');
