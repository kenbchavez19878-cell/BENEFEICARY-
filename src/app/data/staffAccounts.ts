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
    id: "staff-aics", staffId: "MSWD-AICS-DEMO", name: "AICS Staff", username: "staff_aics",
    role: "Staff", assignedModule: "staff-operations",
    assignedSubModules: ["aics"],
    status: "Active", position: "AICS / Crisis Intervention Social Worker",
  },
  {
    id: "staff-women-solo", staffId: "MSWD-WOMEN-DEMO", name: "Women and Solo Parent Staff", username: "staff_women_solo",
    role: "Staff", assignedModule: "staff-operations",
    assignedSubModules: ["women-solo-parent"],
    status: "Active", position: "Women and Solo Parent Staff",
  },
];

export function getStaffById(id: string): StaffAccount | null {
  return STAFF_ACCOUNTS.find((s) => s.id === id) ?? null;
}
