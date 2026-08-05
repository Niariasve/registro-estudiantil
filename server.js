// Servidor de desarrollo local y fallback offline.
// En producción, si se configura Firebase en el frontend, la persistencia se realiza
// directamente en Cloud Firestore y este servidor no es requerido (servidor estático).
const http = require('node:http');
const { readFile, writeFile, mkdir, stat } = require('node:fs/promises');
const { createReadStream } = require('node:fs');
const path = require('node:path');

const PORT = Number(process.env.PORT || 3000);
const PUBLIC_DIR = __dirname;
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

const defaultData = {
  selectedClassId: 'class-1',
  classes: [{ id: 'class-1', name: 'Clase 1', activities: [] }],
  students: [],
  grades: {}
};

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8'
};

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
  const content = await readFile(DB_FILE, 'utf8');
  return JSON.parse(content);
}

async function writeDatabase(data) {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(DB_FILE, `${JSON.stringify(normalizeData(data), null, 2)}\n`, 'utf8');
}

function normalizeData(value) {
  const data = value && typeof value === 'object' ? value : {};
  const classes = Array.isArray(data.classes) && data.classes.length ? data.classes : defaultData.classes;
  const selectedClassId = classes.some((classItem) => classItem.id === data.selectedClassId)
    ? data.selectedClassId
    : classes[0].id;

  return {
    selectedClassId,
    classes: classes.map((classItem) => ({
      id: String(classItem.id || ''),
      name: String(classItem.name || 'Clase sin nombre'),
      activities: Array.isArray(classItem.activities) ? classItem.activities : []
    })),
    students: Array.isArray(data.students) ? data.students : [],
    grades: data.grades && typeof data.grades === 'object' ? data.grades : {}
  };
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
  if (request.url === '/api/data' && request.method === 'GET') {
    sendJson(response, 200, await readDatabase());
    return true;
  }

  if (request.url === '/api/data' && request.method === 'PUT') {
    const body = await readRequestBody(request);
    const data = JSON.parse(body || '{}');
    await writeDatabase(data);
    sendJson(response, 200, await readDatabase());
    return true;
  }

  return false;
}

function safeStaticPath(url) {
  const requestPath = new URL(url, 'http://localhost').pathname;
  const relativePath = requestPath === '/' ? 'index.html' : requestPath.slice(1);
  const filePath = path.normalize(path.join(PUBLIC_DIR, relativePath));
  return filePath.startsWith(PUBLIC_DIR) ? filePath : null;
}

async function serveStatic(request, response) {
  const filePath = safeStaticPath(request.url);
  if (!filePath) {
    response.writeHead(403);
    response.end('Ruta no permitida');
    return;
  }

  try {
    const fileStats = await stat(filePath);
    if (!fileStats.isFile()) throw new Error('No es un archivo');
  } catch {
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

if (require.main === module) {
  createServer().listen(PORT, () => {
    console.log(`Servidor local disponible en http://localhost:${PORT}`);
  });
}

module.exports = { createServer, readDatabase, writeDatabase };
