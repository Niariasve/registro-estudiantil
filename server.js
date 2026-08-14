import http from 'node:http';
import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const PUBLIC_DIR = __dirname;
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

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

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function normalizeData(value) {
  const input = value && typeof value === 'object' ? value : {};

  const classesSource = Array.isArray(input.classes)
    ? input.classes
    : defaultData.classes;

  const classes = classesSource.map((classItem, index) => ({
    id: String(classItem?.id || `class-${index + 1}`),
    name: String(classItem?.name || `Clase ${index + 1}`),
    code: String(classItem?.code || `PARALELO ${index + 1}`),
    term: String(classItem?.term || 'I PAO 2026'),
    color: String(classItem?.color || defaultColors[index % defaultColors.length]),
    activities: Array.isArray(classItem?.activities)
      ? classItem.activities.map((act, actIndex) => ({
          id: String(act?.id || `activity-${index + 1}-${actIndex + 1}`),
          name: String(act?.name || `Actividad ${actIndex + 1}`),
          maxScore: Number.isFinite(Number(act?.maxScore)) && Number(act?.maxScore) >= 0 ? Number(act?.maxScore) : 0
        }))
      : []
  }));

  const students = Array.isArray(input.students)
    ? input.students.map((student, index) => ({
        id: String(student?.id || `student-${index + 1}`),
        name: String(student?.name || `Estudiante ${index + 1}`)
      }))
    : [];

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
  const diagScores = rawDiag.scores && typeof rawDiag.scores === 'object' ? rawDiag.scores : {};

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

async function ensureDatabase() {
  await mkdir(DATA_DIR, { recursive: true });
  try {
    await readFile(DB_FILE, 'utf8');
  } catch {
    await writeDatabase(defaultData);
  }
}

async function readDatabase() {
  await ensureDatabase();
  try {
    const content = await readFile(DB_FILE, 'utf8');
    return normalizeData(JSON.parse(content));
  } catch {
    return defaultData;
  }
}

async function writeDatabase(data) {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(DB_FILE, `${JSON.stringify(normalizeData(data), null, 2)}\n`, 'utf8');
}

function readRequestBody(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    request.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        request.destroy();
        reject(new Error('El cuerpo de la petición es demasiado grande.'));
      }
    });
    request.on('end', () => resolve(body));
    request.on('error', reject);
  });
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(payload));
}

async function handleApi(request, response) {
  const parsed = new URL(request.url, 'http://localhost');
  if (parsed.pathname === '/api/data' && request.method === 'GET') {
    sendJson(response, 200, await readDatabase());
    return true;
  }

  if (parsed.pathname === '/api/data' && request.method === 'PUT') {
    const body = await readRequestBody(request);
    const data = JSON.parse(body || '{}');
    await writeDatabase(data);
    sendJson(response, 200, await readDatabase());
    return true;
  }

  return false;
}

function safeStaticPath(url) {
  const parsed = new URL(url, 'http://localhost');
  let pathname = parsed.pathname;

  // Clean duplicate subpaths
  while (pathname.includes('/paginas/paginas')) {
    pathname = pathname.replace('/paginas/paginas', '/paginas');
  }

  // Common aliases for Tablero / Home
  if (pathname === '/' || pathname === '/index.html' || pathname === '/tablero' || pathname === '/paginas/index.html' || pathname === '/paginas/' || pathname === '/paginas') {
    return path.join(PUBLIC_DIR, 'paginas', 'index.html');
  }

  // Common aliases for Estudiantes
  if (pathname === '/estudiantes' || pathname === '/estudiantes.html' || pathname === '/paginas/estudiantes.html' || pathname === '/paginas/estudiantes') {
    return path.join(PUBLIC_DIR, 'paginas', 'estudiantes.html');
  }

  // Common aliases for Dashboard
  if (pathname === '/dashboard' || pathname === '/dashboard.html' || pathname === '/paginas/dashboard.html' || pathname === '/paginas/dashboard') {
    return path.join(PUBLIC_DIR, 'paginas', 'dashboard.html');
  }

  // Common aliases for Clase
  if (pathname === '/clase' || pathname === '/clase.html' || pathname === '/paginas/clase.html' || pathname === '/paginas/clase') {
    return path.join(PUBLIC_DIR, 'paginas', 'clase.html');
  }

  // Direct file requests
  const cleanPath = pathname.startsWith('/') ? pathname.slice(1) : pathname;
  const filePath = path.normalize(path.join(PUBLIC_DIR, cleanPath));

  if (filePath.startsWith(PUBLIC_DIR)) {
    return filePath;
  }

  return null;
}

async function serveStatic(request, response) {
  const filePath = safeStaticPath(request.url);
  if (!filePath) {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Archivo no encontrado');
    return;
  }

  try {
    const fileStats = await stat(filePath);
    if (!fileStats.isFile()) throw new Error('No es un archivo');
  } catch {
    // If not found in root, try looking in paginas
    try {
      const fallbackPath = path.join(PUBLIC_DIR, 'paginas', path.basename(filePath));
      const fbStats = await stat(fallbackPath);
      if (fbStats.isFile()) {
        const ext = path.extname(fallbackPath);
        response.writeHead(200, { 'Content-Type': contentTypes[ext] || 'application/octet-stream' });
        createReadStream(fallbackPath).pipe(response);
        return;
      }
    } catch {}

    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Archivo no encontrado');
    return;
  }

  const extension = path.extname(filePath);
  response.writeHead(200, { 'Content-Type': contentTypes[extension] || 'application/octet-stream' });
  createReadStream(filePath)
    .on('error', () => {
      if (!response.headersSent) response.writeHead(404);
      response.end('Archivo no encontrado');
    })
    .pipe(response);
}

function createServer() {
  return http.createServer(async (request, response) => {
    try {
      if (await handleApi(request, response)) return;
      await serveStatic(request, response);
    } catch (error) {
      sendJson(response, 500, { error: error.message || 'Error interno del servidor' });
    }
  });
}

const server = createServer();
server.listen(PORT, () => {
  console.log(`Servidor local disponible en http://localhost:${PORT}`);
});
