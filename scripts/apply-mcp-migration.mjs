import fs from 'fs';

const mcpUrl = 'https://supabase.179.33.214.86.sslip.io/mcp';
const sqlPath = process.argv[2];
const migrationName = process.argv[3];

if (!sqlPath || !migrationName) {
  console.error('Usage: node apply-mcp-migration.mjs <sql-file> <migration-name>');
  process.exit(1);
}

const sql = fs.readFileSync(sqlPath, 'utf8');
const headers = { Accept: 'application/json, text/event-stream', 'Content-Type': 'application/json' };

async function mcpCall(method, params, id) {
  const res = await fetch(mcpUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({ jsonrpc: '2.0', id, method, params }),
  });
  return res.text();
}

await mcpCall('initialize', {
  protocolVersion: '2024-11-05',
  capabilities: {},
  clientInfo: { name: 'apply-mcp-migration', version: '1' },
}, 1);

const result = await mcpCall('tools/call', {
  name: 'apply_migration',
  arguments: { name: migrationName, query: sql },
}, 2);

console.log(result);
