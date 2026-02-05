#!/usr/bin/env npx tsx
/**
 * Directus Schema Migration Script
 * 
 * Erstellt die Collections `schools` und `luanti_worlds` programmatisch
 * und erweitert bestehende Collections.
 * 
 * Voraussetzungen:
 *   - Directus läuft auf http://localhost:8055
 *   - Admin-Token in .env oder als Parameter
 * 
 * Ausführung:
 *   DIRECTUS_ADMIN_TOKEN=xxx npx tsx scripts/migrate-schema.ts
 *   
 * Oder mit .env:
 *   npx tsx scripts/migrate-schema.ts
 */

import { createDirectus, rest, staticToken, schemaApply, schemaDiff, readCollections, readFields } from '@directus/sdk';

// Config
const DIRECTUS_URL = process.env.DIRECTUS_URL || 'http://localhost:8055';
const ADMIN_TOKEN = process.env.DIRECTUS_ADMIN_TOKEN;

if (!ADMIN_TOKEN) {
  console.error('❌ DIRECTUS_ADMIN_TOKEN nicht gesetzt!');
  console.error('   Setze: export DIRECTUS_ADMIN_TOKEN=dein_token');
  process.exit(1);
}

// Directus Client mit Admin Token
const client = createDirectus(DIRECTUS_URL)
  .with(staticToken(ADMIN_TOKEN))
  .with(rest());

// Schema-Definition für neue Collections
const targetSchema = {
  collections: [
    {
      collection: 'schools',
      meta: {
        icon: 'school',
        note: 'Schulen/Organisationen im System',
        display_template: '{{ name }}',
        sort_field: 'name',
        archive_field: null,
        archive_value: null,
        unarchive_value: null,
        archive_app_filter: false,
        singleton: false,
        accountability: 'all',
        translations: null,
        item_duplication_fields: null,
        group: null,
        collapse: 'open',
        preview_url: null,
        versioning: false
      },
      schema: {
        name: 'schools'
      }
    },
    {
      collection: 'luanti_worlds',
      meta: {
        icon: 'public',
        note: 'Luanti/Minetest Welten pro Schule',
        display_template: '{{ name }} (Port: {{ world_port }})',
        sort_field: 'name',
        archive_field: null,
        archive_value: null,
        unarchive_value: null,
        archive_app_filter: false,
        singleton: false,
        accountability: 'all',
        translations: null,
        item_duplication_fields: null,
        group: null,
        collapse: 'open',
        preview_url: null,
        versioning: false
      },
      schema: {
        name: 'luanti_worlds'
      }
    }
  ],
  fields: [
    // === SCHOOLS FIELDS ===
    {
      collection: 'schools',
      field: 'id',
      type: 'uuid',
      meta: {
        special: ['uuid'],
        interface: 'input',
        readonly: true,
        hidden: true,
        width: 'full',
        required: false
      },
      schema: {
        is_primary_key: true,
        is_nullable: false,
        has_auto_increment: false
      }
    },
    {
      collection: 'schools',
      field: 'name',
      type: 'string',
      meta: {
        interface: 'input',
        width: 'full',
        required: true,
        note: 'Name der Schule/Organisation'
      },
      schema: {
        is_nullable: false,
        max_length: 200
      }
    },
    {
      collection: 'schools',
      field: 'slug',
      type: 'string',
      meta: {
        interface: 'input',
        width: 'half',
        required: true,
        note: 'URL-freundlicher Identifier (eindeutig)',
        options: {
          slug: true
        }
      },
      schema: {
        is_nullable: false,
        is_unique: true,
        max_length: 200
      }
    },
    {
      collection: 'schools',
      field: 'subscription_tier',
      type: 'string',
      meta: {
        interface: 'select-dropdown',
        width: 'half',
        required: true,
        options: {
          choices: [
            { text: 'Free', value: 'free' },
            { text: 'School', value: 'school' },
            { text: 'Enterprise', value: 'enterprise' }
          ]
        }
      },
      schema: {
        is_nullable: false,
        default_value: 'free'
      }
    },
    {
      collection: 'schools',
      field: 'date_created',
      type: 'timestamp',
      meta: {
        special: ['date-created'],
        interface: 'datetime',
        readonly: true,
        hidden: true,
        width: 'half'
      },
      schema: {
        is_nullable: true
      }
    },
    {
      collection: 'schools',
      field: 'date_updated',
      type: 'timestamp',
      meta: {
        special: ['date-updated'],
        interface: 'datetime',
        readonly: true,
        hidden: true,
        width: 'half'
      },
      schema: {
        is_nullable: true
      }
    },

    // === LUANTI_WORLDS FIELDS ===
    {
      collection: 'luanti_worlds',
      field: 'id',
      type: 'uuid',
      meta: {
        special: ['uuid'],
        interface: 'input',
        readonly: true,
        hidden: true,
        width: 'full'
      },
      schema: {
        is_primary_key: true,
        is_nullable: false
      }
    },
    {
      collection: 'luanti_worlds',
      field: 'school_id',
      type: 'uuid',
      meta: {
        special: ['m2o'],
        interface: 'select-dropdown-m2o',
        width: 'half',
        required: true,
        note: 'Zugehörige Schule',
        options: {
          template: '{{ name }}'
        }
      },
      schema: {
        is_nullable: false,
        foreign_key_table: 'schools',
        foreign_key_column: 'id'
      }
    },
    {
      collection: 'luanti_worlds',
      field: 'name',
      type: 'string',
      meta: {
        interface: 'input',
        width: 'half',
        required: true,
        note: 'Name der Welt'
      },
      schema: {
        is_nullable: false,
        max_length: 100
      }
    },
    {
      collection: 'luanti_worlds',
      field: 'world_port',
      type: 'integer',
      meta: {
        interface: 'input',
        width: 'half',
        required: true,
        note: 'UDP Port (30000-39999)',
        options: {
          min: 30000,
          max: 39999
        }
      },
      schema: {
        is_nullable: false
      }
    },
    {
      collection: 'luanti_worlds',
      field: 'container_id',
      type: 'string',
      meta: {
        interface: 'input',
        width: 'half',
        required: false,
        note: 'Docker Container ID'
      },
      schema: {
        is_nullable: true,
        max_length: 100
      }
    },
    {
      collection: 'luanti_worlds',
      field: 'is_active',
      type: 'boolean',
      meta: {
        interface: 'boolean',
        width: 'half',
        required: false,
        note: 'Welt aktiv?'
      },
      schema: {
        is_nullable: false,
        default_value: true
      }
    },
    {
      collection: 'luanti_worlds',
      field: 'date_created',
      type: 'timestamp',
      meta: {
        special: ['date-created'],
        interface: 'datetime',
        readonly: true,
        hidden: true
      },
      schema: {
        is_nullable: true
      }
    },
    {
      collection: 'luanti_worlds',
      field: 'date_updated',
      type: 'timestamp',
      meta: {
        special: ['date-updated'],
        interface: 'datetime',
        readonly: true,
        hidden: true
      },
      schema: {
        is_nullable: true
      }
    },

    // === DIRECTUS_USERS ERWEITERUNGEN ===
    {
      collection: 'directus_users',
      field: 'school_id',
      type: 'uuid',
      meta: {
        special: ['m2o'],
        interface: 'select-dropdown-m2o',
        width: 'half',
        required: false,
        note: 'Zugehörige Schule',
        options: {
          template: '{{ name }}'
        }
      },
      schema: {
        is_nullable: true,
        foreign_key_table: 'schools',
        foreign_key_column: 'id'
      }
    },
    {
      collection: 'directus_users',
      field: 'luanti_player_name',
      type: 'string',
      meta: {
        interface: 'input',
        width: 'half',
        required: false,
        note: 'Luanti/Minetest Spielername'
      },
      schema: {
        is_nullable: true,
        is_unique: true,
        max_length: 50
      }
    },
    {
      collection: 'directus_users',
      field: 'xp_total',
      type: 'integer',
      meta: {
        interface: 'input',
        width: 'half',
        required: false,
        note: 'Gesamte Erfahrungspunkte'
      },
      schema: {
        is_nullable: false,
        default_value: 0
      }
    },
    {
      collection: 'directus_users',
      field: 'coins_balance',
      type: 'integer',
      meta: {
        interface: 'input',
        width: 'half',
        required: false,
        note: 'Münz-Guthaben'
      },
      schema: {
        is_nullable: false,
        default_value: 0
      }
    },

    // === QUESTS ERWEITERUNG ===
    {
      collection: 'quests',
      field: 'min_level_required',
      type: 'integer',
      meta: {
        interface: 'input',
        width: 'half',
        required: false,
        note: 'Mindest-Level für diese Quest'
      },
      schema: {
        is_nullable: false,
        default_value: 0
      }
    },

    // === QUEST_STEPS ERWEITERUNGEN ===
    {
      collection: 'quest_steps',
      field: 'content_data',
      type: 'json',
      meta: {
        interface: 'input-code',
        width: 'full',
        required: false,
        note: 'Zusätzliche Step-Daten (JSON)',
        options: {
          language: 'json'
        }
      },
      schema: {
        is_nullable: true,
        default_value: '{}'
      }
    },
    {
      collection: 'quest_steps',
      field: 'completion_token_secret',
      type: 'string',
      meta: {
        interface: 'input',
        width: 'half',
        required: false,
        note: 'Secret für Token-Generierung'
      },
      schema: {
        is_nullable: true,
        max_length: 64
      }
    }
  ],
  relations: [
    {
      collection: 'luanti_worlds',
      field: 'school_id',
      related_collection: 'schools',
      meta: {
        one_field: 'worlds',
        sort_field: null,
        one_deselect_action: 'delete'
      },
      schema: {
        on_delete: 'CASCADE'
      }
    },
    {
      collection: 'directus_users',
      field: 'school_id',
      related_collection: 'schools',
      meta: {
        one_field: 'users',
        sort_field: null,
        one_deselect_action: 'nullify'
      },
      schema: {
        on_delete: 'SET NULL'
      }
    }
  ]
};

async function checkExistingCollections(): Promise<Set<string>> {
  try {
    const collections = await client.request(readCollections());
    return new Set(collections.map((c: any) => c.collection));
  } catch (error) {
    console.error('Fehler beim Lesen der Collections:', error);
    return new Set();
  }
}

async function checkExistingFields(collection: string): Promise<Set<string>> {
  try {
    const fields = await client.request(readFields(collection));
    return new Set(fields.map((f: any) => f.field));
  } catch (error) {
    return new Set();
  }
}

async function migrate() {
  console.log('🚀 Starte Directus Schema Migration...\n');
  console.log(`📍 Directus URL: ${DIRECTUS_URL}`);
  
  // 1. Prüfe bestehende Collections
  const existingCollections = await checkExistingCollections();
  console.log(`\n📦 Existierende Collections: ${[...existingCollections].join(', ')}\n`);

  // 2. Filtere Schema - nur neue Collections und Felder
  const filteredSchema = {
    collections: targetSchema.collections.filter(
      c => !existingCollections.has(c.collection)
    ),
    fields: [] as typeof targetSchema.fields,
    relations: [] as typeof targetSchema.relations
  };

  // 3. Prüfe Felder pro Collection
  for (const field of targetSchema.fields) {
    const collectionExists = existingCollections.has(field.collection) || 
                             filteredSchema.collections.some(c => c.collection === field.collection);
    
    if (collectionExists || field.collection === 'directus_users') {
      // Prüfe ob Feld bereits existiert
      if (existingCollections.has(field.collection)) {
        const existingFields = await checkExistingFields(field.collection);
        if (!existingFields.has(field.field)) {
          filteredSchema.fields.push(field);
        } else {
          console.log(`⏭️  Feld ${field.collection}.${field.field} existiert bereits`);
        }
      } else {
        // Neue Collection - alle Felder hinzufügen
        filteredSchema.fields.push(field);
      }
    }
  }

  // 4. Filter Relations
  filteredSchema.relations = targetSchema.relations.filter(r => {
    const isNewCollection = filteredSchema.collections.some(c => c.collection === r.collection);
    const isNewField = filteredSchema.fields.some(
      f => f.collection === r.collection && f.field === r.field
    );
    return isNewCollection || isNewField;
  });

  // 5. Summary
  console.log('\n📋 Migration Summary:');
  console.log(`   - Neue Collections: ${filteredSchema.collections.length}`);
  console.log(`   - Neue Felder: ${filteredSchema.fields.length}`);
  console.log(`   - Neue Relations: ${filteredSchema.relations.length}`);

  if (filteredSchema.collections.length === 0 && 
      filteredSchema.fields.length === 0 && 
      filteredSchema.relations.length === 0) {
    console.log('\n✅ Schema ist bereits aktuell! Keine Migration notwendig.');
    return;
  }

  // 6. Schema Diff berechnen
  console.log('\n🔍 Berechne Schema-Diff...');
  
  try {
    const diff = await client.request(schemaDiff(filteredSchema as any));
    
    if (!diff || (Array.isArray(diff) && diff.length === 0)) {
      console.log('✅ Keine Änderungen erforderlich.');
      return;
    }

    console.log('\n📝 Änderungen werden angewendet...');
    console.log(JSON.stringify(diff, null, 2));

    // 7. Schema anwenden
    await client.request(schemaApply(diff as any));
    
    console.log('\n✅ Schema-Migration erfolgreich abgeschlossen!');
    
  } catch (error: any) {
    if (error?.errors) {
      console.error('\n❌ Directus Fehler:');
      error.errors.forEach((e: any) => {
        console.error(`   - ${e.message}`);
      });
    } else {
      console.error('\n❌ Migration fehlgeschlagen:', error);
    }
    process.exit(1);
  }
}

// Run
migrate().catch(console.error);
