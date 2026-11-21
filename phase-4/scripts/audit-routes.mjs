import fs from 'fs';
import path from 'path';

const apiDir = path.resolve('src/app/api');

function getRouteFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir, { withFileTypes: true });
  for (const file of list) {
    const fullPath = path.join(dir, file.name);
    if (file.isDirectory()) {
      results = results.concat(getRouteFiles(fullPath));
    } else if (file.name === 'route.ts' || file.name === 'route.js') {
      results.push(fullPath);
    }
  }
  return results;
}

const files = getRouteFiles(apiDir);
console.log(`Found ${files.length} route files.`);

const handlers = [];
const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const relPath = path.relative(path.resolve('src/app'), file).replace(/\\/g, '/');
  const routeUrl = '/' + path.dirname(relPath);

  for (const m of methods) {
    // Look for export async function GET or export function GET
    const regex = new RegExp(`export\\s+(?:async\\s+)?function\\s+${m}\\b`);
    if (regex.test(content)) {
      handlers.push({
        route: routeUrl,
        file: relPath,
        method: m,
        hasZod: content.includes('Schema') || content.includes('z.') || content.includes('validateRequest') || content.includes('validations'),
        hasAuth: content.includes('getSession') || content.includes('requireAuth') || content.includes('verifyAuth') || content.includes('authenticate'),
        has422: content.includes('422'),
      });
    }
  }
}

console.log(`Total HTTP Handlers: ${handlers.length}`);
console.log(JSON.stringify(handlers, null, 2));
