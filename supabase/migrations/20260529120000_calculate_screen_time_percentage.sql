-- Migration: Add calculate_screen_time_percentage postgresql helper function
-- This helper function queries daily screen time usage and parent child linkage
-- to return the exact screen time exhaustion percentage for a child on a given date.
-- If the limit is disabled (unlimited) or not set, returns NULL so that frontend knows not to display a progress bar.

CREATE OR REPLACE FUNCTION calculate_screen_time_percentage(p_child_id UUID, p_date DATE)
RETURNS INTEGER AS $$
DECLARE
    v_total_seconds INTEGER := 0;
    v_limit_minutes INTEGER := NULL;
    v_limit_enabled BOOLEAN := FALSE;
BEGIN
    -- 1. Fetch total tracked usage seconds today
    SELECT COALESCE(total_seconds, 0)
    INTO v_total_seconds
    FROM daily_screen_time_usage
    WHERE child_id = p_child_id AND usage_date = p_date;

    -- 2. Fetch screen time limit rules configured by parent
    SELECT daily_limit_minutes, is_screen_time_limit_enabled
    INTO v_limit_minutes, v_limit_enabled
    FROM parent_child_link
    WHERE child_user_id = p_child_id AND is_active = TRUE AND is_approved = TRUE AND deleted_at IS NULL
    LIMIT 1;

    -- 3. If limit is disabled or not set, return NULL representing unlimited state (no progress bar)
    IF NOT COALESCE(v_limit_enabled, FALSE) THEN
        RETURN NULL;
    END IF;

    -- 4. If limit is active but limit minutes is not set or invalid, treat it as unlimited (no progress bar)
    IF v_limit_minutes IS NULL OR v_limit_minutes <= 0 THEN
        RETURN NULL;
    END IF;

    -- 5. Return capped exhaustion percentage
    RETURN LEAST(100, ROUND((v_total_seconds::FLOAT / 60.0 / v_limit_minutes::FLOAT) * 100.0)::INTEGER);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
