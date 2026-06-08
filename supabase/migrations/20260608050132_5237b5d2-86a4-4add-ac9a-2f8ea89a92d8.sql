
-- Roles enum and table
CREATE TYPE public.app_role AS ENUM ('admin', 'customer');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'customer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  membership_tier TEXT NOT NULL DEFAULT 'free',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Admins delete profiles" ON public.profiles FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Auto-create profile + customer role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'customer');
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- PCs
CREATE TABLE public.pcs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  specs TEXT,
  hourly_rate NUMERIC(10,2) NOT NULL DEFAULT 100,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available','occupied','maintenance')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.pcs TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.pcs TO authenticated;
GRANT ALL ON public.pcs TO service_role;
ALTER TABLE public.pcs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone view pcs" ON public.pcs FOR SELECT USING (true);
CREATE POLICY "Admins manage pcs" ON public.pcs FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update pcs" ON public.pcs FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete pcs" ON public.pcs FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- Memberships
CREATE TABLE public.memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier TEXT NOT NULL UNIQUE,
  price NUMERIC(10,2) NOT NULL,
  discount_percent INT NOT NULL DEFAULT 0,
  perks TEXT
);
GRANT SELECT ON public.memberships TO anon, authenticated;
GRANT ALL ON public.memberships TO service_role;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone view memberships" ON public.memberships FOR SELECT USING (true);

-- Bookings
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pc_id UUID REFERENCES public.pcs(id) ON DELETE SET NULL,
  start_time TIMESTAMPTZ NOT NULL,
  duration_hours NUMERIC(4,2) NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','cancelled','completed')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own bookings" ON public.bookings FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Users create own bookings" ON public.bookings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users cancel own / admins manage" ON public.bookings FOR UPDATE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete bookings" ON public.bookings FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- Gaming sessions
CREATE TABLE public.gaming_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  pc_id UUID NOT NULL REFERENCES public.pcs(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_time TIMESTAMPTZ,
  paused_at TIMESTAMPTZ,
  paused_seconds INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','ended')),
  hourly_rate NUMERIC(10,2) NOT NULL,
  total_amount NUMERIC(10,2),
  gst_amount NUMERIC(10,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gaming_sessions TO authenticated;
GRANT ALL ON public.gaming_sessions TO service_role;
ALTER TABLE public.gaming_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage sessions" ON public.gaming_sessions FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Users view own sessions" ON public.gaming_sessions FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Tournaments
CREATE TABLE public.tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  game TEXT NOT NULL,
  event_date TIMESTAMPTZ NOT NULL,
  prize_pool NUMERIC(10,2) NOT NULL DEFAULT 0,
  entry_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  max_participants INT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.tournaments TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.tournaments TO authenticated;
GRANT ALL ON public.tournaments TO service_role;
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone view tournaments" ON public.tournaments FOR SELECT USING (true);
CREATE POLICY "Admins manage tournaments" ON public.tournaments FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update tournaments" ON public.tournaments FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete tournaments" ON public.tournaments FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- Seed
INSERT INTO public.memberships (tier, price, discount_percent, perks) VALUES
  ('free', 0, 0, 'Standard hourly rates'),
  ('silver', 499, 10, '10% off, priority booking'),
  ('gold', 999, 20, '20% off, free snacks, priority booking'),
  ('platinum', 1999, 30, '30% off, dedicated PC slot, free energy drinks');

INSERT INTO public.pcs (name, specs, hourly_rate, status) VALUES
  ('Neon-01', 'RTX 4080 / i9-13900K / 32GB DDR5 / 240Hz', 150, 'available'),
  ('Neon-02', 'RTX 4080 / i9-13900K / 32GB DDR5 / 240Hz', 150, 'available'),
  ('Voltage-03', 'RTX 4070 / i7-13700K / 32GB DDR5 / 165Hz', 120, 'available'),
  ('Voltage-04', 'RTX 4070 / i7-13700K / 32GB DDR5 / 165Hz', 120, 'occupied'),
  ('Pulse-05', 'RTX 4060 / i5-13600K / 16GB DDR5 / 144Hz', 100, 'available'),
  ('Pulse-06', 'RTX 4060 / i5-13600K / 16GB DDR5 / 144Hz', 100, 'maintenance');

INSERT INTO public.tournaments (name, game, event_date, prize_pool, entry_fee, max_participants, description) VALUES
  ('Valorant Showdown', 'Valorant', now() + interval '7 days', 25000, 500, 32, '5v5 tactical shootout. Bring your squad.'),
  ('CS2 Open Cup', 'Counter-Strike 2', now() + interval '14 days', 40000, 750, 16, 'Single elimination. Pro brackets.'),
  ('FIFA Solo Royale', 'FIFA 24', now() + interval '21 days', 15000, 300, 64, '1v1 knockout. Choose your club.');
