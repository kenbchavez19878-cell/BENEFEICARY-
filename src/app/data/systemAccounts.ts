export interface SystemAccount {
  id: string;
  name: string;
  username: string;

  role: "HeadAccount" | "Administrator";
  position: string;
  status: "Active" | "Inactive";
}

export const SYSTEM_ACCOUNTS: SystemAccount[] = [
  {
    id: "head-001",
    name: "Maria Elena Villanueva",
    username: "maria.villanueva",

    role: "HeadAccount",
    position: "Municipal Social Welfare and Development Officer",
    status: "Active",
  },
  {
    id: "admin-001",
    name: "Rafael Antonio Mendoza",
    username: "rafael.mendoza",

    role: "Administrator",
    position: "System Administrator",
    status: "Active",
  },
];

export function getSystemAccountById(id: string): SystemAccount | null {
  return SYSTEM_ACCOUNTS.find((a) => a.id === id) ?? null;
}
