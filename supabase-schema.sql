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
    fuel_level INT DEFAULT 100, -- Persentase 0-100%
    mileage INT DEFAULT 0,      -- Total KM
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
    status VARCHAR(20) DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Aktifkan Row Level Security (RLS)
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;

-- 4. Kebijakan RLS (Policy) agar publik/user anonim bisa membaca dan membuat peminjaman
CREATE POLICY "Allow public read access for vehicles" 
ON public.vehicles FOR SELECT USING (true);

CREATE POLICY "Allow public update access for vehicles" 
ON public.vehicles FOR ALL USING (true);

CREATE POLICY "Allow public read access for loans" 
ON public.loans FOR SELECT USING (true);

CREATE POLICY "Allow public insert access for loans" 
ON public.loans FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access for loans" 
ON public.loans FOR UPDATE USING (true);

-- 5. Data Awal Unit Kendaraan (Seed Data)
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
ON CONFLICT (license_plate) DO NOTHING;
