export interface FamilyMember {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  relationship: string;
  age: number;
  dateOfBirth: string;
  gender: string;
  civilStatus: string;
  contactNumber?: string;
  occupation?: string;
  status: "Active" | "Inactive" | "Pending";
}

export interface ClientProfile {
  id: string;
  name: string;
  firstName: string;
  middleName: string;
  lastName: string;
  barangay: string;
  contactNumber: string;
  dateOfBirth: string;
  age: number;
  gender: string;
  civilStatus: string;
  address: string;
  status: "Active" | "Inactive" | "Pending";
  type: "Individual" | "Family";
  registrationDate: string;
  occupation?: string;
  monthlyIncome?: string;
  familyMembers?: FamilyMember[];
  familyHeadId?: string;
  familyHeadName?: string;
}

export const clientProfilingDatabase: ClientProfile[] = [];
