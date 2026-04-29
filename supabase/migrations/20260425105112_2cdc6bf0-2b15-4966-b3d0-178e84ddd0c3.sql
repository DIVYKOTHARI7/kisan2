-- =========================
-- PROFILES
-- =========================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  village TEXT,
  district TEXT,
  state TEXT,
  pincode TEXT,
  land_acres NUMERIC,
  soil_type TEXT,
  primary_crops TEXT[] DEFAULT '{}',
  preferred_language TEXT DEFAULT 'en',
  onboarded BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles: users select own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Profiles: users insert own"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Profiles: users update own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Profiles: users delete own"
  ON public.profiles FOR DELETE
  USING (auth.uid() = id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================
-- CROP RECOMMENDATIONS
-- =========================
CREATE TABLE public.crop_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  soil_n NUMERIC,
  soil_p NUMERIC,
  soil_k NUMERIC,
  soil_ph NUMERIC,
  soil_type TEXT,
  season TEXT,
  irrigation_type TEXT,
  budget_per_acre NUMERIC,
  pincode TEXT,
  recommendations JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.crop_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "CropRecs: own select"
  ON public.crop_recommendations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "CropRecs: own insert"
  ON public.crop_recommendations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "CropRecs: own update"
  ON public.crop_recommendations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "CropRecs: own delete"
  ON public.crop_recommendations FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_crop_recs_user_created ON public.crop_recommendations(user_id, created_at DESC);

-- =========================
-- DISEASE DETECTIONS
-- =========================
CREATE TABLE public.disease_detections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url TEXT,
  crop TEXT,
  disease TEXT NOT NULL,
  confidence NUMERIC,
  severity TEXT,
  affected_area TEXT,
  description TEXT,
  treatment JSONB DEFAULT '[]'::jsonb,
  cost_estimate TEXT,
  is_treated BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.disease_detections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Disease: own select"
  ON public.disease_detections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Disease: own insert"
  ON public.disease_detections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Disease: own update"
  ON public.disease_detections FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Disease: own delete"
  ON public.disease_detections FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_disease_user_created ON public.disease_detections(user_id, created_at DESC);

-- =========================
-- CHAT
-- =========================
CREATE TABLE public.chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New chat',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ChatConvo: own select"
  ON public.chat_conversations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "ChatConvo: own insert"
  ON public.chat_conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ChatConvo: own update"
  ON public.chat_conversations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "ChatConvo: own delete"
  ON public.chat_conversations FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER trg_chat_convo_updated_at
BEFORE UPDATE ON public.chat_conversations
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user','assistant','system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ChatMsg: own select"
  ON public.chat_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "ChatMsg: own insert"
  ON public.chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ChatMsg: own delete"
  ON public.chat_messages FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_chat_msg_convo_created ON public.chat_messages(conversation_id, created_at);