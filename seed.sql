INSERT OR REPLACE INTO source (id, organization, key, api_url, description, is_enabled, created_at, updated_at)
VALUES (
  'scb-source-id',
  'SCB (Statistiska centralbyrån)',
  'SCB',
  'https://api.scb.se/OV0104/v1/doris/sv/ssd',
  'Comprehensive official statistics for Sweden. Covers all sectors including economy, population, environment, trade, housing, and social conditions.',
  1,
  unixepoch() * 1000,
  unixepoch() * 1000
);
