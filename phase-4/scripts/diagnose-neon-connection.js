/**
 * Neon Connection Diagnostic & Validation Tool
 * scripts/diagnose-neon-connection.js
 *
 * Safely inspects and verifies Neon connection strings without leaking credentials.
 * Works with DIRECT_URL (port 5432) and DATABASE_URL (port 6543).
 */

const fs = require('fs');
const path = require('path');
const tls = require('tls');
const dns = require('dns');
const { URL } = require('url');

// Check potential sources in order of preference:
// 1. Process environment: process.env.DIRECT_URL / process.env.DATABASE_URL
// 2. Local gitignored file: .env.production.local (if exists)
let directUrl = process.env.DIRECT_URL;
let pooledUrl = process.env.DATABASE_URL;

const localProdEnvPath = path.join(__dirname, '..', '.env.production.local');
const localProdEnvExists = fs.existsSync(localProdEnvPath);

if (localProdEnvExists) {
  const content = fs.readFileSync(localProdEnvPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('#') || !trimmed.includes('=')) continue;
    const [key, ...rest] = trimmed.split('=');
    const val = rest.join('=').replace(/^["']|["']$/g, '').trim();
    if (key.trim() === 'DIRECT_URL' && !directUrl) directUrl = val;
    if (key.trim() === 'DATABASE_URL' && !pooledUrl) pooledUrl = val;
  }
}

function parseAndSanitize(rawString, label) {
  if (!rawString) {
    return { label, status: 'MISSING', error: 'Variable is not set in environment or .env.production.local' };
  }

  // Check for common copying mistakes:
  let cleaned = rawString.trim();
  let prefixStripped = false;
  if (cleaned.startsWith('psql ')) {
    cleaned = cleaned.replace(/^psql\s+['"]?/, '').replace(/['"]?$/, '');
    prefixStripped = true;
  }

  // Strip enclosing quotes
  cleaned = cleaned.replace(/^["']|["']$/g, '').trim();

  // Validate scheme
  if (!cleaned.startsWith('postgresql://') && !cleaned.startsWith('postgres://')) {
    return {
      label,
      status: 'INVALID_SCHEME',
      error: `Scheme is not postgresql:// or postgres:// (Starts with: "${cleaned.slice(0, 15)}...")`,
      hint: prefixStripped ? 'Leading "psql" was detected.' : 'Ensure connection string begins with postgresql://',
    };
  }

  try {
    const parsed = new URL(cleaned);
    const host = parsed.hostname;
    // Do not assume a fixed port; default to 5432 if omitted
    const effectivePort = parsed.port ? parseInt(parsed.port, 10) : (cleaned.includes(':6543') ? 6543 : 5432);
    const dbName = parsed.pathname.replace(/^\//, '');
    const user = parsed.username;
    const hasPassword = Boolean(parsed.password);
    const sslMode = parsed.searchParams.get('sslmode');
    const pgbouncer = parsed.searchParams.get('pgbouncer') === 'true';

    // Mask hostname: ep-silent-smoke-a1b2c3d4.ap-southeast-1.neon.tech -> ep-silent-***.ap-southeast-1.neon.tech
    const hostParts = host.split('.');
    const maskedHost = hostParts.length >= 3 
      ? `${hostParts[0].slice(0, 8)}***.${hostParts.slice(1).join('.')}`
      : `${host.slice(0, 5)}***`;

    const isPooler = host.includes('-pooler') || effectivePort === 6543 || pgbouncer;

    return {
      label,
      status: 'PARSED_OK',
      sanitized: {
        scheme: parsed.protocol,
        maskedHost,
        rawHost: host,
        port: effectivePort,
        hasExplicitPort: Boolean(parsed.port),
        database: dbName,
        user,
        hasPassword,
        passwordLength: parsed.password.length,
        sslMode: sslMode || 'none',
        isPooler,
      },
      cleanedUrl: cleaned,
    };
  } catch (err) {
    return {
      label,
      status: 'PARSE_EXCEPTION',
      error: err.message,
      hint: 'The connection string could not be parsed as a valid URI. Special characters in the password (@, #, %) must be URL-encoded.',
    };
  }
}

async function testDnsAndTls(host, port) {
  // Step 1: DNS Resolution Check
  const dnsResult = await new Promise((resolve) => {
    dns.lookup(host, (err, address) => {
      if (err) resolve({ success: false, error: `DNS lookup failed (${err.code})` });
      else resolve({ success: true, ip: address });
    });
  });

  if (!dnsResult.success) {
    return { success: false, stage: 'DNS', error: dnsResult.error };
  }

  // Step 2: Non-destructive TLS Handshake
  return new Promise((resolve) => {
    const socket = tls.connect(
      {
        host,
        port,
        servername: host,
        rejectUnauthorized: true,
        timeout: 8000,
      },
      () => {
        const cert = socket.getPeerCertificate();
        socket.end();
        resolve({
          success: true,
          stage: 'TLS',
          subject: cert.subject ? cert.subject.CN : 'Valid TLS',
          issuer: cert.issuer ? cert.issuer.O : 'Valid CA',
        });
      }
    );

    socket.on('error', (err) => {
      resolve({ success: false, stage: 'TLS', error: err.message });
    });

    socket.on('timeout', () => {
      socket.destroy();
      resolve({ success: false, stage: 'TLS', error: 'Connection timed out (8s)' });
    });
  });
}

async function run() {
  console.log('=================================================================');
  console.log('       HORIZON PORTAL — NEON CONNECTION DIAGNOSTIC               ');
  console.log('=================================================================\n');

  console.log(`[INFO] .env.production.local file present: ${localProdEnvExists ? 'YES' : 'NO'}`);

  if (!directUrl && !pooledUrl) {
    console.log('\n[NOTICE] Both DIRECT_URL and DATABASE_URL are absent.');
    console.log('Please create `.env.production.local` with:');
    console.log('  DIRECT_URL="postgresql://neondb_owner:[PASSWORD]@[HOST]:5432/[DB]?sslmode=require"');
    console.log('  DATABASE_URL="postgresql://neondb_owner:[PASSWORD]@[HOST]:6543/[DB]?sslmode=require&pgbouncer=true"');
    console.log('\nDiagnostics cannot execute without variables configured.');
    return;
  }

  if (!directUrl || !pooledUrl) {
    console.log('\n[WARNING] Only one of DIRECT_URL or DATABASE_URL was found.');
    console.log(` - DIRECT_URL present:   ${Boolean(directUrl)}`);
    console.log(` - DATABASE_URL present: ${Boolean(pooledUrl)}`);
    console.log('Both variables must be supplied before diagnostic execution.\n');
    return;
  }

  console.log('▶ [1/2] Auditing DIRECT_URL (Migration Connection)...');
  const directResult = parseAndSanitize(directUrl, 'DIRECT_URL');
  if (directResult.status === 'PARSED_OK') {
    const s = directResult.sanitized;
    console.log(`   ✓ Status:           VALID URI STRUCTURE`);
    console.log(`   ✓ Scheme:           ${s.scheme}`);
    console.log(`   ✓ Host:             ${s.maskedHost}`);
    console.log(`   ✓ Port:             ${s.port} (${s.hasExplicitPort ? 'explicit' : 'default'} - ${s.isPooler ? 'WARNING: Pooler detected on DIRECT_URL' : 'Direct session mode — OK for DDL'})`);
    console.log(`   ✓ Database:         ${s.database}`);
    console.log(`   ✓ User:             ${s.user}`);
    console.log(`   ✓ Password:         [CONFIGURED - ${s.passwordLength} chars]`);
    console.log(`   ✓ SSL Mode:         ${s.sslMode}`);

    console.log(`   ▶ Testing DNS & TLS Handshake to ${s.maskedHost}:${s.port}...`);
    const connTest = await testDnsAndTls(s.rawHost, s.port);
    if (connTest.success) {
      console.log(`   ✓ DNS & TLS Handshake: SUCCESS (Cert: ${connTest.subject}, Issuer: ${connTest.issuer})`);
    } else {
      console.log(`   ✗ ${connTest.stage} Check Failed: (${connTest.error})`);
    }
  } else {
    console.log(`   ✗ Status:           ${directResult.status}`);
    console.log(`   ✗ Error:            ${directResult.error}`);
    if (directResult.hint) console.log(`   ℹ Hint:             ${directResult.hint}`);
  }

  console.log('\n▶ [2/2] Auditing DATABASE_URL (Pooled Runtime Connection)...');
  const pooledResult = parseAndSanitize(pooledUrl, 'DATABASE_URL');
  if (pooledResult.status === 'PARSED_OK') {
    const s = pooledResult.sanitized;
    console.log(`   ✓ Status:           VALID URI STRUCTURE`);
    console.log(`   ✓ Scheme:           ${s.scheme}`);
    console.log(`   ✓ Host:             ${s.maskedHost}`);
    console.log(`   ✓ Port:             ${s.port} (${s.hasExplicitPort ? 'explicit' : 'default'} - ${s.isPooler ? 'Pooled / PgBouncer mode — OK for serverless runtime' : 'Direct mode'})`);
    console.log(`   ✓ Database:         ${s.database}`);
    console.log(`   ✓ User:             ${s.user}`);
    console.log(`   ✓ Password:         [CONFIGURED - ${s.passwordLength} chars]`);
    console.log(`   ✓ SSL Mode:         ${s.sslMode}`);

    console.log(`   ▶ Testing DNS & TLS Handshake to ${s.maskedHost}:${s.port}...`);
    const connTest = await testDnsAndTls(s.rawHost, s.port);
    if (connTest.success) {
      console.log(`   ✓ DNS & TLS Handshake: SUCCESS (Cert: ${connTest.subject}, Issuer: ${connTest.issuer})`);
    } else {
      console.log(`   ✗ ${connTest.stage} Check Failed: (${connTest.error})`);
    }
  } else {
    console.log(`   ✗ Status:           ${pooledResult.status}`);
    console.log(`   ✗ Error:            ${pooledResult.error}`);
    if (pooledResult.hint) console.log(`   ℹ Hint:             ${pooledResult.hint}`);
  }

  console.log('\n=================================================================');
  console.log('DIAGNOSTIC SUMMARY:');
  console.log(` - DIRECT_URL:   ${directResult.status === 'PARSED_OK' ? 'READY' : 'ACTION REQUIRED'}`);
  console.log(` - DATABASE_URL: ${pooledResult.status === 'PARSED_OK' ? 'READY' : 'ACTION REQUIRED'}`);
  console.log('=================================================================\n');
}

run().catch((err) => {
  console.error('Fatal diagnostic error:', err);
  process.exit(1);
});
