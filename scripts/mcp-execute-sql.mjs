import fs from 'fs';

const query = process.argv[2] || fs.readFileSync(process.argv[3], 'utf8');
const headers = { Accept: 'application/json, text/event-stream', 'Content-Type': 'application/json' };

async function mcpCall(method, params, id) {
  const res = await fetch('https://supabase.179.33.214.86.sslip.io/mcp', {
    method: 'POST',
    headers,
    body: JSON.stringify({ jsonrpc: '2.0', id, method, params }),
  });
  return res.text();
}

await mcpCall('initialize', {
  protocolVersion: '2024-11-05',
  capabilities: {},
  clientInfo: { name: 'mcp-execute-sql', version: '1' },
}, 1);

const result = await mcpCall('tools/call', {
  name: 'execute_sql',
  arguments: { query },
}, 2);

console.log(result);
