// Mock data for the customer portal — matches Prisma schema types

export const mockUser = {
  id: "usr_abc123",
  name: "Marcus Johnson",
  email: "marcus.johnson@gmail.com",
  phone: "(248) 555-0147",
  role: "CUSTOMER" as const,
  createdAt: new Date("2025-09-15"),
};

export const mockVehicles = [
  {
    id: "veh_001",
    userId: "usr_abc123",
    year: 2024,
    make: "BMW",
    model: "M4 Competition",
    trim: "xDrive",
    color: "Brooklyn Grey",
    vin: "WBS43AZ09R1234567",
    createdAt: new Date("2025-09-15"),
  },
  {
    id: "veh_002",
    userId: "usr_abc123",
    year: 2023,
    make: "Ford",
    model: "Bronco",
    trim: "Wildtrak",
    color: "Eruption Green",
    vin: "1FMEE5DP3PLA12345",
    createdAt: new Date("2025-11-02"),
  },
  {
    id: "veh_003",
    userId: "usr_abc123",
    year: 2025,
    make: "Tesla",
    model: "Model 3",
    trim: "Performance",
    color: "Ultra White",
    vin: null,
    createdAt: new Date("2026-01-20"),
  },
];

export type MockJob = {
  id: string;
  userId: string;
  vehicleId: string;
  quoteId: string | null;
  status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "PICKED_UP";
  services: string[];
  notes: string | null;
  total: number | null;
  startDate: Date | null;
  endDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  vehicle: (typeof mockVehicles)[number];
};

export const mockJobs: MockJob[] = [
  {
    id: "job_001",
    userId: "usr_abc123",
    vehicleId: "veh_001",
    quoteId: "qt_001",
    status: "IN_PROGRESS",
    services: ["ceramic-coating", "paint-correction"],
    notes: "Full paint correction before ceramic coat application. Customer requested extra attention to hood swirl marks.",
    total: 1299,
    startDate: new Date("2026-03-22"),
    endDate: null,
    createdAt: new Date("2026-03-20"),
    updatedAt: new Date("2026-03-24"),
    vehicle: mockVehicles[0],
  },
  {
    id: "job_002",
    userId: "usr_abc123",
    vehicleId: "veh_002",
    quoteId: "qt_002",
    status: "SCHEDULED",
    services: ["window-tint", "windshield-protection"],
    notes: "Ceramic tint all around, 20% rear, 35% front. Windshield PPF.",
    total: 649,
    startDate: new Date("2026-03-28"),
    endDate: null,
    createdAt: new Date("2026-03-18"),
    updatedAt: new Date("2026-03-18"),
    vehicle: mockVehicles[1],
  },
  {
    id: "job_003",
    userId: "usr_abc123",
    vehicleId: "veh_003",
    quoteId: "qt_003",
    status: "COMPLETED",
    services: ["paint-protection-film", "ceramic-coating"],
    notes: "Full front PPF + ceramic coating on entire vehicle.",
    total: 2899,
    startDate: new Date("2026-03-10"),
    endDate: new Date("2026-03-14"),
    createdAt: new Date("2026-03-08"),
    updatedAt: new Date("2026-03-14"),
    vehicle: mockVehicles[2],
  },
  {
    id: "job_004",
    userId: "usr_abc123",
    vehicleId: "veh_001",
    quoteId: null,
    status: "PICKED_UP",
    services: ["detailing"],
    notes: "Interior and exterior detail.",
    total: 349,
    startDate: new Date("2026-02-20"),
    endDate: new Date("2026-02-21"),
    createdAt: new Date("2026-02-18"),
    updatedAt: new Date("2026-02-21"),
    vehicle: mockVehicles[0],
  },
];

export type MockQuote = {
  id: string;
  userId: string | null;
  vehicleId: string | null;
  status: "PENDING" | "REVIEWED" | "APPROVED" | "DECLINED" | "EXPIRED";
  services: string[];
  notes: string | null;
  total: number | null;
  createdAt: Date;
  updatedAt: Date;
  vehicle: (typeof mockVehicles)[number] | null;
};

export const mockQuotes: MockQuote[] = [
  {
    id: "qt_005",
    userId: "usr_abc123",
    vehicleId: "veh_001",
    status: "PENDING",
    services: ["vehicle-wraps"],
    notes: "Interested in satin black full wrap. Want to see color samples first.",
    total: null,
    createdAt: new Date("2026-03-23"),
    updatedAt: new Date("2026-03-23"),
    vehicle: mockVehicles[0],
  },
  {
    id: "qt_004",
    userId: "usr_abc123",
    vehicleId: "veh_002",
    status: "REVIEWED",
    services: ["ceramic-coating", "paint-correction"],
    notes: "Looking for full correction and coating before summer.",
    total: 1199,
    createdAt: new Date("2026-03-15"),
    updatedAt: new Date("2026-03-17"),
    vehicle: mockVehicles[1],
  },
  {
    id: "qt_003",
    userId: "usr_abc123",
    vehicleId: "veh_003",
    status: "APPROVED",
    services: ["paint-protection-film", "ceramic-coating"],
    notes: "Full front PPF + ceramic coating.",
    total: 2899,
    createdAt: new Date("2026-03-05"),
    updatedAt: new Date("2026-03-07"),
    vehicle: mockVehicles[2],
  },
  {
    id: "qt_006",
    userId: "usr_abc123",
    vehicleId: "veh_001",
    status: "DECLINED",
    services: ["vehicle-wraps", "ceramic-coating"],
    notes: "Full color change wrap + ceramic on top. Customer decided to wait.",
    total: 4299,
    createdAt: new Date("2026-01-10"),
    updatedAt: new Date("2026-01-15"),
    vehicle: mockVehicles[0],
  },
];

// Recent activity events for the dashboard
export const mockActivity = [
  {
    id: "act_001",
    type: "job_update" as const,
    message: "Your BMW M4 paint correction is in progress",
    date: new Date("2026-03-24T10:30:00"),
  },
  {
    id: "act_002",
    type: "quote_received" as const,
    message: "New quote submitted for Bronco ceramic coating",
    date: new Date("2026-03-23T14:15:00"),
  },
  {
    id: "act_003",
    type: "job_completed" as const,
    message: "Tesla Model 3 PPF + ceramic coating is ready for pickup",
    date: new Date("2026-03-14T16:00:00"),
  },
  {
    id: "act_004",
    type: "quote_approved" as const,
    message: "Quote approved for Tesla Model 3 full front PPF",
    date: new Date("2026-03-07T09:00:00"),
  },
  {
    id: "act_005",
    type: "job_picked_up" as const,
    message: "BMW M4 detailing picked up",
    date: new Date("2026-02-21T11:00:00"),
  },
];

// Helper to get service name from ID
const SERVICE_NAMES: Record<string, string> = {
  "ceramic-coating": "Ceramic Coating",
  "paint-protection-film": "Paint Protection Film",
  "window-tint": "Window Tint",
  "vehicle-wraps": "Vehicle Wraps",
  "paint-correction": "Paint Correction",
  "detailing": "Detailing",
  "windshield-protection": "Windshield Protection",
};

export function getServiceName(id: string): string {
  return SERVICE_NAMES[id] || id;
}
