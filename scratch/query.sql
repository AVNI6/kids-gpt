BEGIN;
SET enable_seqscan = off;
EXPLAIN ANALYZE SELECT r.id, r.rewards_amount, r.description, r.created_at, r.updated_at, r.source_type, r.score, act.id 
FROM public.rewards r 
LEFT JOIN public.activity_settings act ON r.source_id = act.id 
WHERE r.user_id = 'a5d5b256-0a4e-4f70-a334-b10861d5e86e' 
ORDER BY r.updated_at DESC, r.created_at DESC;
COMMIT;
