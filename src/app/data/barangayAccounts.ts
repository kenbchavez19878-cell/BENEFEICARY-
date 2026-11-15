export interface BarangayAccount {
  id: string;
  employeeId: string;
  name: string;
  firstName: string;
  username: string;

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
    id: "barangay-secretary-demo",
    employeeId: "BRGY-SEC-001",
    name: "Maria Lourdes Villanueva",
    firstName: "Maria Lourdes",
    username: "barangaysecretary",

    role: "BarangaySecretary",
    position: "Barangay Secretary",
    assignedBarangay: "Brgy. San Vicente",
    municipality: "Calabanga",
    province: "Camarines Sur",
    mobile: "0918-654-3210",
    email: "maria.lourdes.villanueva@gmail.com",
    gender: "Female",
    status: "Active",
  },
];

export function getBarangayById(id: string): BarangayAccount | null {
  return BARANGAY_ACCOUNTS.find((b) => b.id === id) ?? null;
}
