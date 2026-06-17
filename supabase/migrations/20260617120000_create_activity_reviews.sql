-- Migration: Create activity_reviews table with RLS policies
-- Date: 2026-06-17 12:00:00 UTC
--
-- PURPOSE:
--   Store detailed per-attempt gameplay snapshots so parents can review
--   exactly how their child answered each question, card, or word.
--
--   This is an ADDITIVE migration — no existing tables are modified.
--   Old rewards rows that predate this feature will have no corresponding
--   activity_reviews row; the parent UI handles this gracefully.
--
-- SECURITY:
--   - Kids can INSERT and SELECT their own reviews
--   - Parents can SELECT reviews of their approved linked children
--   - Teachers can SELECT reviews of their classroom students
--   - No UPDATE/DELETE is allowed by anyone (immutable audit log)

-- ============================================================
-- 1. Create the activity_reviews table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.activity_reviews (
  id                    uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid         NOT NULL REFERENCES public.profile(user_id) ON DELETE CASCADE,
  activity_type         varchar(100) NOT NULL,
  reward_id             uuid         REFERENCES public.rewards(id) ON DELETE SET NULL,
  submission_id         uuid         REFERENCES public.assignment_submissions(id) ON DELETE SET NULL,
  -- Soft reference only — no FK so old generated_activities rows can be pruned freely
  generated_activity_id uuid,
  score_percentage      integer      NOT NULL DEFAULT 0 CHECK (score_percentage >= 0 AND score_percentage <= 100),
  xp_earned             integer      NOT NULL DEFAULT 0 CHECK (xp_earned >= 0),
  duration_seconds      integer      CHECK (duration_seconds IS NULL OR duration_seconds >= 0),
  review_data           jsonb        NOT NULL DEFAULT '{}',
  created_at            timestamp WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================================
-- 2. Performance indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_activity_reviews_user_id
  ON public.activity_reviews (user_id);

CREATE INDEX IF NOT EXISTS idx_activity_reviews_activity_type
  ON public.activity_reviews (activity_type);

CREATE INDEX IF NOT EXISTS idx_activity_reviews_reward_id
  ON public.activity_reviews (reward_id)
  WHERE reward_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_activity_reviews_submission_id
  ON public.activity_reviews (submission_id)
  WHERE submission_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_activity_reviews_created_at
  ON public.activity_reviews (created_at DESC);

-- ============================================================
-- 3. Enable Row-Level Security
-- ============================================================
ALTER TABLE public.activity_reviews ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 4. RLS Policies
-- ============================================================

-- Kids can read their own reviews
CREATE POLICY "activity_reviews_select_own"
  ON public.activity_reviews
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Kids can insert their own reviews
CREATE POLICY "activity_reviews_insert_own"
  ON public.activity_reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Parents can read reviews of their approved linked children
CREATE POLICY "activity_reviews_select_by_parent"
  ON public.activity_reviews
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.parent_child_link pcl
      WHERE pcl.parent_user_id = auth.uid()
        AND pcl.child_user_id  = activity_reviews.user_id
        AND pcl.is_approved    IS TRUE
        AND pcl.deleted_at     IS NULL
    )
  );

-- Teachers can read reviews of their classroom students
CREATE POLICY "activity_reviews_select_by_teacher"
  ON public.activity_reviews
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.classroom_members cm
      JOIN public.classrooms c ON c.id = cm.classroom_id
      WHERE c.teacher_user_id    = auth.uid()
        AND cm.student_user_id   = activity_reviews.user_id
        AND cm.status            = 'APPROVED'
    )
  );
