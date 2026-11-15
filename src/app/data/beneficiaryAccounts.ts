export interface BeneficiaryAccount {
  id: string;
  beneficiaryId: string;
  name: string;
  firstName: string;
  username: string;

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

export function getBeneficiaryById(id: string): BeneficiaryAccount | null {
  return BENEFICIARY_ACCOUNTS.find((b) => b.id === id) ?? null;
}
