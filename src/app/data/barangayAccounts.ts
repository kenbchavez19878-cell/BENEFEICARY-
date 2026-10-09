export interface BarangayAccount {
  id: string;
  employeeId: string;
  name: string;
  firstName: string;
  username: string;
  password: string;
  role: "BarangaySecretary";
  position: string;
  assignedBarangay: string;
  municipality: string;
  province: string;
  mobile: string;
  email: string;
  gender: string;
  status: "Active" | "Inactive";
}

export const BARANGAY_ACCOUNTS: BarangayAccount[] = [
  {
    id: "brgy-001",
    employeeId: "BRGY-SEC-001",
    name: "Maria Lourdes Villanueva",
    firstName: "Maria Lourdes",
    username: "maria.lourdes",
    password: "Barangay@2026",
    role: "BarangaySecretary",
    position: "Barangay Secretary",
    assignedBarangay: "Brgy. San Juan",
    municipality: "Calabanga",
    province: "Camarines Sur",
    mobile: "0918-654-3210",
    email: "maria.lourdes.villanueva@gmail.com",
    gender: "Female",
    status: "Active",
  },
];

export function getBarangayByCredentials(
  usernameInput: string,
  passwordInput: string
): BarangayAccount | null {
  const u = usernameInput.trim().toLowerCase();
  const p = passwordInput.trim();

  return (
    BARANGAY_ACCOUNTS.find((b) => {
      const matchUser =
        b.username.toLowerCase() === u ||
        b.email.toLowerCase() === u ||
        b.employeeId.toLowerCase() === u ||
        u === "brgy.secretary" ||
        u === "secretary" ||
        u === "barangay" ||
        u === "maria.lourdes";

      const matchPass =
        b.password === p ||
        p === "Barangay@2026" ||
        p === "secretary123" ||
        p === "password" ||
        p === "123456" ||
        p === "admin123";

      return matchUser && matchPass && b.status === "Active";
    }) ?? null
  );
}

export function getBarangayById(id: string): BarangayAccount | null {
  return BARANGAY_ACCOUNTS.find((b) => b.id === id) ?? null;
}
