import { readFileSync, writeFileSync } from 'fs';

const dbData = JSON.parse(readFileSync('data/db.json', 'utf8'));

// Update defaultData in api/data.js
const apiDataPath = 'api/data.js';
let apiContent = readFileSync(apiDataPath, 'utf8');

const defaultDataStr = `const defaultData = ${JSON.stringify(dbData, null, 2)};`;

// Replace const defaultData = { ... };
apiContent = apiContent.replace(/const defaultData = \{[\s\S]*?\n\};\n\nlet supabaseClient/m, `${defaultDataStr}\n\nlet supabaseClient`);
writeFileSync(apiDataPath, apiContent, 'utf8');
console.log('Updated defaultData in api/data.js');

// Update defaultData in server.js
const serverPath = 'server.js';
let serverContent = readFileSync(serverPath, 'utf8');
serverContent = serverContent.replace(/const defaultData = \{[\s\S]*?\n\};\n\nconst contentTypes/m, `${defaultDataStr}\n\nconst contentTypes`);
writeFileSync(serverPath, serverContent, 'utf8');
console.log('Updated defaultData in server.js');

// Update defaultData in src/js/storage.js
const storagePath = 'src/js/storage.js';
let storageContent = readFileSync(storagePath, 'utf8');
storageContent = storageContent.replace(/const defaultData = \{[\s\S]*?\n  \};\n\n  let data/m, `${defaultDataStr.replace(/^/gm, '  ').trimStart()}\n\n  let data`);
writeFileSync(storagePath, storageContent, 'utf8');
console.log('Updated defaultData in src/js/storage.js');
