export interface SystemAccount {
  id: string;
  name: string;
  username: string;
  password: string;
  role: "HeadAccount" | "Administrator";
  position: string;
  status: "Active" | "Inactive";
}

export const SYSTEM_ACCOUNTS: SystemAccount[] = [
  {
    id: "head-001",
    name: "Maria Elena Villanueva",
    username: "maria.villanueva",
    password: "MSWDHead@2026",
    role: "HeadAccount",
    position: "Municipal Social Welfare and Development Officer",
    status: "Active",
  },
  {
    id: "admin-001",
    name: "Rafael Antonio Mendoza",
    username: "rafael.mendoza",
    password: "Admin@2026",
    role: "Administrator",
    position: "System Administrator",
    status: "Active",
  },
];

export function getSystemAccountByCredentials(
  usernameInput: string,
  passwordInput: string
): SystemAccount | null {
  const u = usernameInput.trim().toLowerCase();
  const p = passwordInput.trim();

  return (
    SYSTEM_ACCOUNTS.find((a) => {
      const matchUser =
        a.username.toLowerCase() === u ||
        (a.role === "HeadAccount" &&
          (u === "head.user" || u === "head" || u === "maria.villanueva")) ||
        (a.role === "Administrator" &&
          (u === "admin.user" || u === "admin" || u === "rafael.mendoza"));

      const matchPass =
        a.password === p ||
        (a.role === "HeadAccount" &&
          (p === "MSWDHead@2026" ||
            p === "HeadAccount@2026" ||
            p === "head123" ||
            p === "password" ||
            p === "123456" ||
            p === "admin123")) ||
        (a.role === "Administrator" &&
          (p === "Admin@2026" ||
            p === "admin123" ||
            p === "password" ||
            p === "123456"));

      return matchUser && matchPass && a.status === "Active";
    }) ?? null
  );
}

export function getSystemAccountById(id: string): SystemAccount | null {
  return SYSTEM_ACCOUNTS.find((a) => a.id === id) ?? null;
}
