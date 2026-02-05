# Migration: External Providers Integration

## Description
Adds support for external learning providers like CodeCombat, including provider configuration and progress tracking.

## SQL Migration

```sql
-- Create external_providers table
CREATE TABLE external_providers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name varchar(255) NOT NULL,
    api_key text,
    webhook_secret text,
    base_url varchar(255) NOT NULL,
    status varchar(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    date_created timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    date_updated timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- Create external_progress table
CREATE TABLE external_progress (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES directus_users(id) ON DELETE SET NULL,
    provider_id uuid REFERENCES external_providers(id) ON DELETE CASCADE,
    external_user_id varchar(255) NOT NULL,
    external_level_id varchar(255) NOT NULL,
    status varchar(50) DEFAULT 'completed' CHECK (status IN ('completed', 'failed')),
    date_completed timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    date_created timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    date_updated timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- Add external provider fields to quest_steps
ALTER TABLE quest_steps 
ADD COLUMN external_id varchar(255),
ADD COLUMN provider_id uuid REFERENCES external_providers(id) ON DELETE SET NULL;

-- Create indexes
CREATE INDEX idx_external_progress_user ON external_progress(user_id);
CREATE INDEX idx_external_progress_provider ON external_progress(provider_id);
CREATE INDEX idx_external_progress_external_ids ON external_progress(external_user_id, external_level_id);
CREATE INDEX idx_quest_steps_external ON quest_steps(external_id, provider_id);

-- Create unique constraint to prevent duplicate progress
CREATE UNIQUE INDEX idx_unique_external_progress 
ON external_progress(user_id, provider_id, external_level_id) 
WHERE status = 'completed';

-- Add Directus collection metadata
INSERT INTO directus_collections 
(collection, icon, note, display_template, hidden, singleton, translations, archive_field, archive_app_filter, archive_value, unarchive_value, sort_field)
VALUES
('external_providers', 'hub', 'External Learning Providers', '{{name}}', false, false, null, 'status', true, 'inactive', 'active', null),
('external_progress', 'school', 'External Learning Progress', null, false, false, null, null, true, null, null, null);

-- Add Directus field metadata for external_providers
INSERT INTO directus_fields
(collection, field, special, interface, options, display, display_options, readonly, hidden, sort, width, translations, note, required, unique, validation)
VALUES
('external_providers', 'id', 'uuid', 'input', null, null, null, true, true, 1, 'full', null, null, false, false, null),
('external_providers', 'name', null, 'input', null, 'formatted-value', null, false, false, 2, 'full', null, 'Provider name (e.g. CodeCombat)', true, false, null),
('external_providers', 'api_key', null, 'input-hash', '{"masked": true}', null, null, false, false, 3, 'full', null, 'API key for provider authentication', true, false, null),
('external_providers', 'webhook_secret', null, 'input-hash', '{"masked": true}', null, null, false, false, 4, 'full', null, 'Secret for webhook validation', true, false, null),
('external_providers', 'base_url', null, 'input', null, null, null, false, false, 5, 'full', null, 'Base URL for provider API', true, false, null),
('external_providers', 'status', null, 'select-dropdown', '{"choices":[{"text":"Active","value":"active"},{"text":"Inactive","value":"inactive"}]}', 'labels', null, false, false, 6, 'full', null, null, false, false, null);

-- Add Directus field metadata for external_progress
INSERT INTO directus_fields
(collection, field, special, interface, options, display, display_options, readonly, hidden, sort, width, translations, note, required, unique, validation)
VALUES
('external_progress', 'id', 'uuid', 'input', null, null, null, true, true, 1, 'full', null, null, false, false, null),
('external_progress', 'user_id', 'm2o', 'select-dropdown-m2o', null, 'related-values', null, false, false, 2, 'full', null, null, true, false, null),
('external_progress', 'provider_id', 'm2o', 'select-dropdown-m2o', null, 'related-values', null, false, false, 3, 'full', null, null, true, false, null),
('external_progress', 'external_user_id', null, 'input', null, null, null, false, false, 4, 'full', null, 'User ID at provider', true, false, null),
('external_progress', 'external_level_id', null, 'input', null, null, null, false, false, 5, 'full', null, 'Level ID at provider', true, false, null),
('external_progress', 'status', null, 'select-dropdown', '{"choices":[{"text":"Completed","value":"completed"},{"text":"Failed","value":"failed"}]}', 'labels', null, false, false, 6, 'half', null, null, false, false, null),
('external_progress', 'date_completed', 'date-created', 'datetime', null, 'datetime', null, true, false, 7, 'half', null, null, false, false, null);

-- Add Directus field metadata for quest_steps external fields
INSERT INTO directus_fields
(collection, field, special, interface, options, display, display_options, readonly, hidden, sort, width, translations, note, required, unique, validation)
VALUES
('quest_steps', 'external_id', null, 'input', null, null, null, false, false, 8, 'full', null, 'External level identifier', false, false, null),
('quest_steps', 'provider_id', 'm2o', 'select-dropdown-m2o', null, 'related-values', null, false, false, 9, 'full', null, 'External provider reference', false, false, null);
```

## Rollback SQL

```sql
-- Remove Directus field metadata
DELETE FROM directus_fields WHERE collection = 'external_providers';
DELETE FROM directus_fields WHERE collection = 'external_progress';
DELETE FROM directus_fields WHERE collection = 'quest_steps' AND field IN ('external_id', 'provider_id');

-- Remove Directus collection metadata
DELETE FROM directus_collections WHERE collection IN ('external_providers', 'external_progress');

-- Drop indexes
DROP INDEX IF EXISTS idx_external_progress_user;
DROP INDEX IF EXISTS idx_external_progress_provider;
DROP INDEX IF EXISTS idx_external_progress_external_ids;
DROP INDEX IF EXISTS idx_quest_steps_external;
DROP INDEX IF EXISTS idx_unique_external_progress;

-- Remove quest_steps columns
ALTER TABLE quest_steps 
DROP COLUMN IF EXISTS external_id,
DROP COLUMN IF EXISTS provider_id;

-- Drop tables
DROP TABLE IF EXISTS external_progress;
DROP TABLE IF EXISTS external_providers;
```

## Notes
- Creates new tables for external provider management
- Adds external integration fields to quest_steps
- Sets up proper indexes for performance
- Includes Directus metadata for admin interface
- Ensures data integrity with foreign keys and unique constraints