#!/usr/bin/env npx tsx
/**
 * Directus Schema Audit Script
 * 
 * Prüft, ob die erwarteten Collections und Felder nach einer
 * manuellen DB-Migration vorhanden sind.
 * 
 * Ausführung:
 *   DIRECTUS_ADMIN_TOKEN=xxx npx tsx scripts/audit-schema.ts
 *   
 * Oder mit .env (falls dotenv installiert):
 *   npx tsx scripts/audit-schema.ts
 */

// ANSI Farb-Codes für Terminal-Ausgabe
const COLORS = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

function logSuccess(msg: string) {
  console.log(`${COLORS.green}✓ ${msg}${COLORS.reset}`);
}

function logError(msg: string) {
  console.log(`${COLORS.red}✗ ${msg}${COLORS.reset}`);
}

function logInfo(msg: string) {
  console.log(`${COLORS.cyan}ℹ ${msg}${COLORS.reset}`);
}

function logHeader(msg: string) {
  console.log(`\n${COLORS.bold}${COLORS.cyan}═══ ${msg} ═══${COLORS.reset}\n`);
}

// Konfiguration
const DIRECTUS_URL = process.env.DIRECTUS_URL || 'http://localhost:8055';
const ADMIN_TOKEN = process.env.DIRECTUS_ADMIN_TOKEN;

if (!ADMIN_TOKEN) {
  console.error('DIRECTUS_ADMIN_TOKEN muss in .env gesetzt sein');
  process.exit(1);
}

// Erwartete Struktur
const EXPECTED_COLLECTIONS = ['schools', 'luanti_worlds'];
const EXPECTED_USER_FIELDS = ['xp_total', 'coins_balance', 'school_id'];

interface SchemaSnapshot {
  collections: Array<{
    collection: string;
    meta?: Record<string, unknown>;
    schema?: Record<string, unknown>;
  }>;
  fields: Array<{
    collection: string;
    field: string;
    type: string;
    meta?: Record<string, unknown>;
    schema?: Record<string, unknown>;
  }>;
  relations?: Array<Record<string, unknown>>;
}

async function fetchSchemaSnapshot(): Promise<SchemaSnapshot> {
  const url = `${DIRECTUS_URL}/schema/snapshot`;
  
  logInfo(`Abfrage: ${url}`);
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${ADMIN_TOKEN}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  const json = await response.json();
  return json.data as SchemaSnapshot;
}

function checkCollections(schema: SchemaSnapshot): { found: string[]; missing: string[] } {
  const existingCollections = new Set(schema.collections.map(c => c.collection));
  
  const found: string[] = [];
  const missing: string[] = [];
  
  for (const collection of EXPECTED_COLLECTIONS) {
    if (existingCollections.has(collection)) {
      found.push(collection);
    } else {
      missing.push(collection);
    }
  }
  
  return { found, missing };
}

function checkUserFields(schema: SchemaSnapshot): { found: string[]; missing: string[] } {
  const userFields = schema.fields
    .filter(f => f.collection === 'directus_users')
    .map(f => f.field);
  
  const existingFields = new Set(userFields);
  
  const found: string[] = [];
  const missing: string[] = [];
  
  for (const field of EXPECTED_USER_FIELDS) {
    if (existingFields.has(field)) {
      found.push(field);
    } else {
      missing.push(field);
    }
  }
  
  return { found, missing };
}

async function main() {
  console.log(`\n${COLORS.bold}Directus Schema Audit${COLORS.reset}`);
  console.log(`URL: ${DIRECTUS_URL}`);
  console.log(`Token: ${ADMIN_TOKEN.substring(0, 8)}...`);
  
  try {
    // Schema-Snapshot abrufen
    logHeader('Schema-Snapshot abrufen');
    const schema = await fetchSchemaSnapshot();
    logSuccess(`Schema geladen: ${schema.collections.length} Collections, ${schema.fields.length} Felder`);
    
    // Collections prüfen
    logHeader('Collections prüfen');
    const collectionResult = checkCollections(schema);
    
    for (const c of collectionResult.found) {
      logSuccess(`Collection "${c}" existiert`);
    }
    for (const c of collectionResult.missing) {
      logError(`Collection "${c}" FEHLT!`);
    }
    
    // User-Felder prüfen
    logHeader('directus_users Felder prüfen');
    const fieldResult = checkUserFields(schema);
    
    for (const f of fieldResult.found) {
      logSuccess(`Feld "directus_users.${f}" existiert`);
    }
    for (const f of fieldResult.missing) {
      logError(`Feld "directus_users.${f}" FEHLT!`);
    }
    
    // Zusammenfassung
    logHeader('Ergebnis');
    
    const totalMissing = collectionResult.missing.length + fieldResult.missing.length;
    
    if (totalMissing === 0) {
      console.log(`${COLORS.bold}${COLORS.green}╔═══════════════════════════════════════════╗${COLORS.reset}`);
      console.log(`${COLORS.bold}${COLORS.green}║  ✓ ALLE PRÜFUNGEN BESTANDEN!             ║${COLORS.reset}`);
      console.log(`${COLORS.bold}${COLORS.green}║    Die Migration war erfolgreich.        ║${COLORS.reset}`);
      console.log(`${COLORS.bold}${COLORS.green}╚═══════════════════════════════════════════╝${COLORS.reset}`);
      process.exit(0);
    } else {
      console.log(`${COLORS.bold}${COLORS.red}╔═══════════════════════════════════════════╗${COLORS.reset}`);
      console.log(`${COLORS.bold}${COLORS.red}║  ✗ ${totalMissing} FEHLER GEFUNDEN!       ║${COLORS.reset}`);
      console.log(`${COLORS.bold}${COLORS.red}║    Die Migration ist unvollständig.       ║${COLORS.reset}`);
      console.log(`${COLORS.bold}${COLORS.red}╚═══════════════════════════════════════════╝${COLORS.reset}`);
      
      if (collectionResult.missing.length > 0) {
        console.log(`\n${COLORS.red}Fehlende Collections:${COLORS.reset}`);
        collectionResult.missing.forEach(c => console.log(`  - ${c}`));
      }
      if (fieldResult.missing.length > 0) {
        console.log(`\n${COLORS.red}Fehlende Felder in directus_users:${COLORS.reset}`);
        fieldResult.missing.forEach(f => console.log(`  - ${f}`));
      }
      
      process.exit(1);
    }
    
  } catch (error) {
    logHeader('FEHLER');
    if (error instanceof Error) {
      logError(`Konnte Schema nicht abrufen: ${error.message}`);
      
      if (error.message.includes('401') || error.message.includes('403')) {
        console.log(`\n${COLORS.yellow}Hinweis: Prüfe den Admin-Token!${COLORS.reset}`);
        console.log(`Token wird gelesen aus: DIRECTUS_ADMIN_TOKEN Umgebungsvariable`);
      }
      if (error.message.includes('ECONNREFUSED')) {
        console.log(`\n${COLORS.yellow}Hinweis: Directus scheint nicht zu laufen!${COLORS.reset}`);
        console.log(`Erwartete URL: ${DIRECTUS_URL}`);
      }
    } else {
      logError(`Unbekannter Fehler: ${error}`);
    }
    process.exit(2);
  }
}

main();
