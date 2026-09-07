-- List candidate rows for MANUAL review before migrating to platform_public.
-- Replace :legacy_church_id with your known demo/showcase church UUID (DEFAULT_CHURCH_ID).
-- Do NOT run migrate-showcase-content.sql until you have confirmed each id below.

-- \set legacy_church_id '00000000-0000-0000-0000-000000000000'

SELECT 'songs' AS content_type, id, song_title AS title, created_at
FROM songs
WHERE content_scope = 'organization' AND church_id = :'legacy_church_id'
ORDER BY created_at DESC;

SELECT 'sermons' AS content_type, id, title, created_at
FROM sermons
WHERE content_scope = 'organization' AND church_id = :'legacy_church_id'
ORDER BY created_at DESC;

SELECT 'articles' AS content_type, id, title, created_at
FROM articles
WHERE content_scope = 'organization' AND church_id = :'legacy_church_id'
ORDER BY created_at DESC;

SELECT 'events' AS content_type, id, title, created_at
FROM events
WHERE content_scope = 'organization' AND church_id = :'legacy_church_id'
ORDER BY created_at DESC;

SELECT 'donation_campaigns' AS content_type, id, title, created_at
FROM donation_campaigns
WHERE content_scope = 'organization' AND church_id = :'legacy_church_id'
ORDER BY created_at DESC;

SELECT 'video_shorts' AS content_type, id, left(caption, 80) AS title, created_at
FROM video_shorts
WHERE content_scope = 'organization' AND church_id = :'legacy_church_id'
ORDER BY created_at DESC;

-- Prayer requests are NEVER migrated to platform_public.
-- SELECT id FROM prayer_requests WHERE church_id = :'legacy_church_id';

-- Rows that CANNOT be classified automatically (require manual review):
-- 1. Any content in non-legacy churches created while SuperAdmin was testing org workspaces
-- 2. Any content in the legacy church that was meant for a real organization tenant
-- 3. Donations with completed payment rows tied to a specific org billing context
-- 4. Shorts whose storage paths use churchId folders (URLs remain valid after migration; ownership changes only)
