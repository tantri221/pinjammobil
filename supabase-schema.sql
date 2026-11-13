-- ===================================================
-- Skema Database Supabase: PinjamMobil
-- Salin dan jalankan script ini di SQL Editor Supabase
-- ===================================================

-- 1. Buat Tabel Kendaraan (vehicles)
CREATE TABLE IF NOT EXISTS public.vehicles (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    license_plate VARCHAR(20) NOT NULL UNIQUE,
    type VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'borrowed', 'maintenance')),
    capacity INT DEFAULT 7,
    fuel_level INT DEFAULT 100,
    mileage INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Buat Tabel Peminjaman (loans)
CREATE TABLE IF NOT EXISTS public.loans (
    id BIGSERIAL PRIMARY KEY,
    vehicle_id BIGINT REFERENCES public.vehicles(id) ON DELETE SET NULL,
    borrower_name VARCHAR(100) NOT NULL,
    division VARCHAR(50) NOT NULL,
    purpose VARCHAR(255) NOT NULL,
    destination VARCHAR(255) NOT NULL,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    start_mileage INT DEFAULT 0,
    end_mileage INT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Opsional: Tambah kolom verifikasi & persetujuan berjenjang
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS approval_spv VARCHAR(20) DEFAULT 'pending';
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS approval_ga VARCHAR(20) DEFAULT 'pending';
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS approval_adh VARCHAR(20) DEFAULT 'pending';

-- 3. Buat Tabel Pengguna Aplikasi (app_users)
CREATE TABLE IF NOT EXISTS public.app_users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(30),
    password VARCHAR(100) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(20) DEFAULT 'staff' CHECK (role IN ('admin', 'staff', 'ga', 'spv', 'adh')),
    division VARCHAR(50) DEFAULT 'Operasional',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Opsional: Tambah kolom phone ke app_users jika tabel sudah dibuat sebelumnya
ALTER TABLE public.app_users ADD COLUMN IF NOT EXISTS phone VARCHAR(30);

-- Perbarui Batasan Role untuk Mendukung GA, SPV, dan ADH
ALTER TABLE public.app_users DROP CONSTRAINT IF EXISTS app_users_role_check;
ALTER TABLE public.app_users ADD CONSTRAINT app_users_role_check CHECK (role IN ('admin', 'staff', 'ga', 'spv', 'adh'));

-- 4. Buat Tabel Pengaturan Aplikasi (app_settings)
CREATE TABLE IF NOT EXISTS public.app_settings (
    key VARCHAR(50) PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Berikan Hak Akses (GRANT) ke Role anon dan authenticated
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON TABLE public.vehicles TO anon, authenticated;
GRANT ALL ON TABLE public.loans TO anon, authenticated;
GRANT ALL ON TABLE public.app_users TO anon, authenticated;
GRANT ALL ON TABLE public.app_settings TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- 6. Aktifkan Row Level Security (RLS)
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- 7. Kebijakan RLS (Policies)
DROP POLICY IF EXISTS "Allow public read vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Allow public write vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Allow public read loans" ON public.loans;
DROP POLICY IF EXISTS "Allow public insert loans" ON public.loans;
DROP POLICY IF EXISTS "Allow public update loans" ON public.loans;
DROP POLICY IF EXISTS "Allow public delete loans" ON public.loans;
DROP POLICY IF EXISTS "Allow public all app_users" ON public.app_users;
DROP POLICY IF EXISTS "Allow public all app_settings" ON public.app_settings;

CREATE POLICY "Allow public read vehicles" ON public.vehicles FOR SELECT USING (true);
CREATE POLICY "Allow public write vehicles" ON public.vehicles FOR ALL USING (true);

CREATE POLICY "Allow public read loans" ON public.loans FOR SELECT USING (true);
CREATE POLICY "Allow public insert loans" ON public.loans FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update loans" ON public.loans FOR UPDATE USING (true);
CREATE POLICY "Allow public delete loans" ON public.loans FOR DELETE USING (true);

CREATE POLICY "Allow public all app_users" ON public.app_users FOR ALL USING (true);
CREATE POLICY "Allow public all app_settings" ON public.app_settings FOR ALL USING (true);

-- 8. Data Default Pengaturan: REGISTRASI SECARA DEFAULT MATI (false)
INSERT INTO public.app_settings (key, value)
VALUES ('allow_registration', 'false')
ON CONFLICT (key) DO NOTHING;

-- 9. Data Default User & Role
INSERT INTO public.app_users (username, email, password, name, role, division)
VALUES 
('admin', 'admin@pinjammobil.com', 'password123', 'Administrator IT', 'admin', 'IT & Operasional'),
('staff', 'staff@pinjammobil.com', 'password123', 'Staff Operasional', 'staff', 'Sales')
ON CONFLICT (username) DO NOTHING;

-- 10. Data Awal Unit Kendaraan (Seed Data)
INSERT INTO public.vehicles (name, license_plate, type, status, capacity, fuel_level, mileage)
VALUES
('VELOZ TESTDRIVE', 'B 1024 TD', 'MPV', 'available', 7, 85, 12400),
('AGYA TESTDRIVE', 'B 1452 TD', 'Hatchback', 'available', 5, 90, 8900),
('RANGGA TESTDRIVE', 'B 1890 TD', 'Commercial', 'available', 3, 100, 4200),
('VELOZ AST', 'B 2110 AST', 'MPV', 'borrowed', 7, 60, 24500),
('SIENTA AST', 'B 2330 AST', 'MPV', 'available', 7, 75, 31000),
('ZENIX', 'B 2550 ZX', 'Hybrid MPV', 'available', 7, 95, 15000),
('VELOZ OPERASIONAL', 'B 2770 OP', 'MPV', 'maintenance', 7, 40, 48000),
('RAIZE OPERASIONAL', 'B 2990 OP', 'SUV', 'available', 5, 80, 21500),
('RANGGA TMS', 'B 3110 TMS', 'Commercial', 'available', 3, 90, 9300)
ON CONFLICT (license_plate) DO UPDATE SET
  type = EXCLUDED.type,
  capacity = EXCLUDED.capacity,
  fuel_level = EXCLUDED.fuel_level,
  mileage = EXCLUDED.mileage;
