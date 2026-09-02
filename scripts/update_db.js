import { readFileSync, writeFileSync } from 'fs';
import path from 'path';

const testData = JSON.parse(readFileSync('data/test_results_paralelo_b.json', 'utf8'));

const dbPath = 'data/db.json';
let db = {};
try {
  db = JSON.parse(readFileSync(dbPath, 'utf8'));
} catch (e) {
  db = {};
}

// Prepare students array
const students = testData.students.map((st, idx) => ({
  id: st.id,
  num: st.num,
  name: st.name,
  cedula: st.cedula,
  email: st.email
}));

// Prepare classes
const classes = [
  {
    id: 'class-paralelo-b',
    name: 'Computación - Paralelo B',
    code: 'PARALELO B',
    term: 'I PAO 2026',
    color: '#0284c7',
    activities: [
      { id: 'act-pretest', name: 'Test Inicial (Pre-Test)', maxScore: 10 },
      { id: 'act-posttest', name: 'Test Final (Post-Test)', maxScore: 10 },
      { id: 'act-taller-1', name: 'Taller 1: Algoritmos', maxScore: 10 },
      { id: 'act-taller-2', name: 'Taller 2: Patrones y Bucles', maxScore: 10 }
    ]
  }
];

// Prepare grades
const grades = {};
testData.students.forEach(st => {
  if (st.preTest.score !== null) {
    grades[`${st.id}:act-pretest`] = st.preTest.score;
  }
  if (st.postTest.score !== null) {
    grades[`${st.id}:act-posttest`] = st.postTest.score;
  }
});

// Prepare diagnosticTests
const diagnosticScores = {};
testData.students.forEach(st => {
  diagnosticScores[st.id] = {
    pre: st.preTest.score,
    post: st.postTest.score,
    preAnswers: st.preTest.answers,
    postAnswers: st.postTest.answers,
    prePerception: st.preTest.perception,
    postPerception: st.postTest.perception
  };
});

const updatedDb = {
  selectedClassId: 'class-paralelo-b',
  classes,
  students,
  grades,
  diagnosticTests: {
    maxScore: 10,
    courseInfo: {
      institution: testData.institution,
      period: testData.period,
      parallel: testData.parallel,
      course: testData.course
    },
    scores: diagnosticScores
  }
};

writeFileSync(dbPath, JSON.stringify(updatedDb, null, 2), 'utf8');
console.log(`Updated ${dbPath} with 42 students from Paralelo B.`);
