-- Migrate ONLY explicitly identified showcase content to platform_public.
-- Edit the UUID lists below after running list-showcase-candidates.sql and manual review.
-- Never migrate by created_by / SuperAdmin role alone.
-- Prayer requests must NOT be included.

BEGIN;

-- Example (replace with your confirmed showcase ids):
-- UPDATE songs
-- SET content_scope = 'platform_public', organization_id = NULL, church_id = NULL
-- WHERE id IN (
--   '11111111-1111-1111-1111-111111111111'
-- ) AND content_scope = 'organization';

-- UPDATE sermons
-- SET content_scope = 'platform_public', organization_id = NULL, church_id = NULL
-- WHERE id IN () AND content_scope = 'organization';

-- UPDATE articles
-- SET content_scope = 'platform_public', organization_id = NULL, church_id = NULL
-- WHERE id IN () AND content_scope = 'organization';

-- UPDATE events
-- SET content_scope = 'platform_public', organization_id = NULL, church_id = NULL
-- WHERE id IN () AND content_scope = 'organization';

-- UPDATE donation_campaigns
-- SET content_scope = 'platform_public', organization_id = NULL, church_id = NULL
-- WHERE id IN () AND content_scope = 'organization';

-- UPDATE video_shorts
-- SET content_scope = 'platform_public', organization_id = NULL, church_id = NULL
-- WHERE id IN () AND content_scope = 'organization';

-- Donations inherit scope from campaigns; update after campaigns if needed:
-- UPDATE donations d
-- SET content_scope = 'platform_public', organization_id = NULL, church_id = NULL
-- FROM donation_campaigns c
-- WHERE d.campaign_id = c.id AND c.content_scope = 'platform_public';

COMMIT;
