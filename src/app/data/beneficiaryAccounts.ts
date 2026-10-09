export interface BeneficiaryAccount {
  id: string;
  beneficiaryId: string;
  name: string;
  firstName: string;
  username: string;
  password: string;
  role: "Beneficiary";
  profileType: string;
  familyRegistryId: string;
  barangay: string;
  municipality: string;
  province: string;
  mobile: string;
  email: string;
  gender: string;
  status: "Verified" | "Pending" | "Inactive";
}

export const BENEFICIARY_ACCOUNTS: BeneficiaryAccount[] = [
  {
    id: "ben-001",
    beneficiaryId: "BEN-2026-000125",
    name: "Maria Cristina Santos Reyes",
    firstName: "Maria Cristina",
    username: "maria.reyes",
    password: "Beneficiary@2026",
    role: "Beneficiary",
    profileType: "Family Beneficiary",
    familyRegistryId: "FAM-2026-00125",
    barangay: "Brgy. San Juan",
    municipality: "Calabanga",
    province: "Camarines Sur",
    mobile: "0917-456-7821",
    email: "maria.reyes@gmail.com",
    gender: "Female",
    status: "Verified",
  },
];

export function getBeneficiaryByCredentials(
  usernameInput: string,
  passwordInput: string
): BeneficiaryAccount | null {
  const u = usernameInput.trim().toLowerCase();
  const p = passwordInput.trim();

  return (
    BENEFICIARY_ACCOUNTS.find((b) => {
      const matchUser =
        b.username.toLowerCase() === u ||
        b.email.toLowerCase() === u ||
        b.beneficiaryId.toLowerCase() === u ||
        u === "beneficiary" ||
        u === "resident" ||
        u === "maria.reyes";

      const matchPass =
        b.password === p ||
        p === "Beneficiary@2026" ||
        p === "password" ||
        p === "123456" ||
        p === "admin123";

      return matchUser && matchPass && b.status !== "Inactive";
    }) ?? null
  );
}

export function getBeneficiaryById(id: string): BeneficiaryAccount | null {
  return BENEFICIARY_ACCOUNTS.find((b) => b.id === id) ?? null;
}
