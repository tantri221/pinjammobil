export const INITIAL_VEHICLES = [
  {
    id: 1,
    name: 'VELOZ TESTDRIVE',
    license_plate: 'B 1024 TD',
    classification: 'Kendaraan Test Drive',
    type: 'MPV',
    status: 'available', // available | borrowed | maintenance
    capacity: 7,
    fuel_level: 85,
    mileage: 12400
  },
  {
    id: 2,
    name: 'AGYA TESTDRIVE',
    license_plate: 'B 1452 TD',
    classification: 'Kendaraan Test Drive',
    type: 'Hatchback',
    status: 'available',
    capacity: 5,
    fuel_level: 90,
    mileage: 8900
  },
  {
    id: 3,
    name: 'RANGGA TESTDRIVE',
    license_plate: 'B 1890 TD',
    classification: 'Kendaraan Test Drive',
    type: 'Commercial',
    status: 'available',
    capacity: 3,
    fuel_level: 100,
    mileage: 4200
  },
  {
    id: 4,
    name: 'VELOZ AST',
    license_plate: 'B 2110 AST',
    classification: 'Kendaraan AST',
    type: 'MPV',
    status: 'borrowed',
    capacity: 7,
    fuel_level: 60,
    mileage: 24500
  },
  {
    id: 5,
    name: 'SIENTA AST',
    license_plate: 'B 2330 AST',
    classification: 'Kendaraan AST',
    type: 'MPV',
    status: 'available',
    capacity: 7,
    fuel_level: 75,
    mileage: 31000
  },
  {
    id: 6,
    name: 'ZENIX',
    license_plate: 'B 2550 ZX',
    classification: 'Kendaraan Oprasional / Aset',
    type: 'Hybrid MPV',
    status: 'available',
    capacity: 7,
    fuel_level: 95,
    mileage: 15000
  },
  {
    id: 7,
    name: 'VELOZ OPERASIONAL',
    license_plate: 'B 2770 OP',
    classification: 'Kendaraan Oprasional / Aset',
    type: 'MPV',
    status: 'maintenance',
    capacity: 7,
    fuel_level: 40,
    mileage: 48000
  },
  {
    id: 8,
    name: 'RAIZE OPERASIONAL',
    license_plate: 'B 2990 OP',
    classification: 'Kendaraan Oprasional / Aset',
    type: 'SUV',
    status: 'available',
    capacity: 5,
    fuel_level: 80,
    mileage: 21500
  },
  {
    id: 9,
    name: 'RANGGA TMS',
    license_plate: 'B 3110 TMS',
    classification: 'Kendaraan Oprasional / Aset',
    type: 'Commercial',
    status: 'available',
    capacity: 3,
    fuel_level: 90,
    mileage: 9300
  }
];

export const INITIAL_LOANS = [
  {
    id: 1,
    vehicle_id: 4,
    vehicle_name: 'VELOZ AST',
    license_plate: 'B 2110 AST',
    borrower_name: 'Budi Santoso',
    division: 'Sales',
    purpose: 'Kunjungan Customer VIP Jabodetabek',
    destination: 'BSD City, Tangerang',
    start_date: new Date(Date.now() - 3600000 * 4).toISOString(),
    end_date: new Date(Date.now() + 3600000 * 6).toISOString(),
    start_mileage: 24450,
    status: 'approved',
    notes: 'Unit dalam kondisi prima'
  }
];
