-- 1. Explain child comprehensive data inner queries
EXPLAIN ANALYZE SELECT total_experience_points, current_streak, longest_streak FROM public.profile WHERE user_id = 'a5d5b256-0a4e-4f70-a334-b10861d5e86e' AND deleted_at IS NULL;
EXPLAIN ANALYZE SELECT daily_limit_minutes, is_screen_time_limit_enabled FROM public.parent_child_link WHERE parent_user_id = 'eb0f7454-82a1-4bba-a336-e39534db8a1d' AND child_user_id = 'a5d5b256-0a4e-4f70-a334-b10861d5e86e' AND is_approved = true AND deleted_at IS NULL;
EXPLAIN ANALYZE SELECT r.id, r.rewards_amount, r.description, r.created_at, r.updated_at, r.source_type, r.score, act.id FROM public.rewards r LEFT JOIN public.activity_settings act ON r.source_id = act.id WHERE r.user_id = 'a5d5b256-0a4e-4f70-a334-b10861d5e86e' ORDER BY r.updated_at DESC, r.created_at DESC;
EXPLAIN ANALYZE SELECT id, resolved FROM public.safety_alerts WHERE user_id = 'a5d5b256-0a4e-4f70-a334-b10861d5e86e' AND deleted_at IS NULL;
EXPLAIN ANALYZE SELECT messages_sent, usage_date FROM public.daily_usage_tracking WHERE user_id = 'a5d5b256-0a4e-4f70-a334-b10861d5e86e' AND deleted_at IS NULL ORDER BY usage_date DESC;
EXPLAIN ANALYZE SELECT id, title, created_at FROM public.chat_sessions WHERE user_id = 'a5d5b256-0a4e-4f70-a334-b10861d5e86e' AND deleted_at IS NULL ORDER BY created_at DESC;
EXPLAIN ANALYZE SELECT total_seconds FROM public.daily_screen_time_usage WHERE child_id = 'a5d5b256-0a4e-4f70-a334-b10861d5e86e' AND usage_date = '2026-06-10';

-- 2. Explain teacher dashboard analytics inner queries
EXPLAIN ANALYZE SELECT count(*)::int FROM public.assignments WHERE teacher_user_id = '373808b2-c12f-41fe-ac47-066ba9c0f84f' AND status = 'PUBLISHED' AND deleted_at IS NULL;
EXPLAIN ANALYZE SELECT count(*)::int FROM public.assignment_submissions s JOIN public.assignments a ON s.assignment_id = a.id WHERE a.teacher_user_id = '373808b2-c12f-41fe-ac47-066ba9c0f84f' AND s.score IS NULL AND s.deleted_at IS NULL AND a.deleted_at IS NULL;
EXPLAIN ANALYZE SELECT count(*)::int FROM public.classroom_resources WHERE teacher_user_id = '373808b2-c12f-41fe-ac47-066ba9c0f84f' AND deleted_at IS NULL;
EXPLAIN ANALYZE SELECT count(*)::int FROM public.announcements WHERE teacher_user_id = '373808b2-c12f-41fe-ac47-066ba9c0f84f' AND deleted_at IS NULL;
EXPLAIN ANALYZE SELECT count(DISTINCT ae.actor_user_id)::int FROM public.activity_events ae JOIN public.classroom_members cm ON ae.actor_user_id = cm.student_user_id JOIN public.classrooms c ON cm.classroom_id = c.id WHERE c.teacher_user_id = '373808b2-c12f-41fe-ac47-066ba9c0f84f' AND cm.status = 'APPROVED' AND ae.actor_role = 'kid' AND ae.created_at >= '2026-06-09T16:00:00Z';
