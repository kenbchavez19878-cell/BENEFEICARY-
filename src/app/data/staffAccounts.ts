export interface StaffAccount {
  id: string;
  staffId: string;
  name: string;
  username: string;

  role: "Staff";
  assignedModule: string;
  assignedSubModules: string[];
  status: "Active" | "Inactive";
  position: string;
}

export const STAFF_ACCOUNTS: StaffAccount[] = [
  {
    id: "staff-001",
    staffId: "MSWD-STAFF-001",
    name: "Juan Miguel Ramos",
    username: "juan.ramos",

    role: "Staff",
    assignedModule: "staff-operations",
    assignedSubModules: ["applications", "assessment", "disbursement", "monitoring"],
    status: "Active",
    position: "Social Welfare Officer",
  },
];

export function getStaffById(id: string): StaffAccount | null {
  return STAFF_ACCOUNTS.find((s) => s.id === id) ?? null;
}
