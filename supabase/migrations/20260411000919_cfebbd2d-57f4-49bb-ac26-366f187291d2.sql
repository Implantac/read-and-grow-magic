
-- Points log
CREATE TABLE public.gamification_points (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sales_rep_id TEXT NOT NULL,
  action_type TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  reference_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Badge catalog
CREATE TABLE public.gamification_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL DEFAULT '🏆',
  category TEXT NOT NULL DEFAULT 'sales',
  criteria JSONB DEFAULT '{}'::jsonb,
  points_required INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Badge awards
CREATE TABLE public.gamification_badge_awards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sales_rep_id TEXT NOT NULL,
  badge_id UUID NOT NULL REFERENCES public.gamification_badges(id) ON DELETE CASCADE,
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(sales_rep_id, badge_id)
);

-- Missions
CREATE TABLE public.gamification_missions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  mission_type TEXT NOT NULL DEFAULT 'daily',
  action_type TEXT NOT NULL,
  target_count INTEGER NOT NULL DEFAULT 1,
  reward_points INTEGER NOT NULL DEFAULT 10,
  icon TEXT DEFAULT '🎯',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Mission progress
CREATE TABLE public.gamification_mission_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sales_rep_id TEXT NOT NULL,
  mission_id UUID NOT NULL REFERENCES public.gamification_missions(id) ON DELETE CASCADE,
  current_count INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  mission_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(sales_rep_id, mission_id, mission_date)
);

-- Challenges
CREATE TABLE public.gamification_challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  challenge_type TEXT NOT NULL DEFAULT 'sales_value',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  prize_description TEXT,
  bonus_points INTEGER DEFAULT 100,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Challenge participants
CREATE TABLE public.gamification_challenge_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id UUID NOT NULL REFERENCES public.gamification_challenges(id) ON DELETE CASCADE,
  sales_rep_id TEXT NOT NULL,
  score NUMERIC NOT NULL DEFAULT 0,
  rank INTEGER,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(challenge_id, sales_rep_id)
);

-- RLS
ALTER TABLE public.gamification_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gamification_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gamification_badge_awards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gamification_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gamification_mission_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gamification_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gamification_challenge_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth read points" ON public.gamification_points FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth insert points" ON public.gamification_points FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth read badges" ON public.gamification_badges FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth read awards" ON public.gamification_badge_awards FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth insert awards" ON public.gamification_badge_awards FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth read missions" ON public.gamification_missions FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth read mission_progress" ON public.gamification_mission_progress FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth upsert mission_progress" ON public.gamification_mission_progress FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth update mission_progress" ON public.gamification_mission_progress FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth read challenges" ON public.gamification_challenges FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth read challenge_parts" ON public.gamification_challenge_participants FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth insert challenge_parts" ON public.gamification_challenge_participants FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth update challenge_parts" ON public.gamification_challenge_participants FOR UPDATE TO authenticated USING (true);

-- Indexes
CREATE INDEX idx_gam_points_rep ON public.gamification_points(sales_rep_id);
CREATE INDEX idx_gam_points_date ON public.gamification_points(created_at);
CREATE INDEX idx_gam_mission_prog ON public.gamification_mission_progress(sales_rep_id, mission_date);
