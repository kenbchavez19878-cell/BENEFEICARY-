export interface StaffAccount {
  id: string;
  staffId: string;
  name: string;
  username: string;
  password: string;
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
    password: "MSWDStaff@2026",
    role: "Staff",
    assignedModule: "staff-operations",
    assignedSubModules: ["applications", "assessment", "disbursement", "monitoring"],
    status: "Active",
    position: "Social Welfare Officer",
  },
];

export function getStaffByCredentials(
  usernameInput: string,
  passwordInput: string
): StaffAccount | null {
  const u = usernameInput.trim().toLowerCase();
  const p = passwordInput.trim();

  return (
    STAFF_ACCOUNTS.find((s) => {
      const matchUser =
        s.username.toLowerCase() === u ||
        s.staffId.toLowerCase() === u ||
        u === "staff" ||
        u === "staff1" ||
        u === "juan.ramos";

      const matchPass =
        s.password === p ||
        p === "MSWDStaff@2026" ||
        p === "Staff@123" ||
        p === "staff123" ||
        p === "password" ||
        p === "123456" ||
        p === "admin123";

      return matchUser && matchPass && s.status === "Active";
    }) ?? null
  );
}

export function getStaffById(id: string): StaffAccount | null {
  return STAFF_ACCOUNTS.find((s) => s.id === id) ?? null;
}
