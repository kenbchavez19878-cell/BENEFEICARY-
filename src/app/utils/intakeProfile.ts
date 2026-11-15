export interface SeparatedNameFields {
  firstName: string;
  middleName: string;
  lastName: string;
  extensionName: string;
}

export function ageFromBirthDate(value: string): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return 0;
  const birth = new Date(`${value}T00:00:00`);
  if (!Number.isFinite(birth.getTime())) return 0;
  const today = new Date();
  const birthdayPending = today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate());
  return Math.max(0, today.getFullYear() - birth.getFullYear() - Number(birthdayPending));
}

// Name parts only come from explicit attributes, never from a formatted display name.
export function mapNameFields(row: Record<string, any>): SeparatedNameFields {
  return {
    firstName: row.first_name ?? row.firstName ?? "",
    middleName: row.middle_name ?? row.middleName ?? "",
    lastName: row.last_name ?? row.lastName ?? "",
    extensionName: row.extension_name ?? row.extensionName ?? "",
  };
}

export interface IntakeProfile extends SeparatedNameFields {
  birthDate: string;
  gender: string;
  civilStatus: string;
  contactNumber: string;
  indigencyLevel: string;
  incomeStatus: string;
  dependentChildren: number | null;
  soloParentReason: string;
  crisisSummary: string;
  serviceProvider: string;
}

export function mapIntakeProfile(row: Record<string, any>): IntakeProfile {
  return {
    ...mapNameFields(row),
    birthDate: row.birth_date ?? row.birthDate ?? "",
    gender: row.gender ?? "",
    civilStatus: row.civil_status ?? row.civilStatus ?? "",
    contactNumber: row.contact_number ?? row.contactNumber ?? "",
    indigencyLevel: row.indigency_level ?? row.indigencyLevel ?? "",
    incomeStatus: row.income_status ?? row.incomeStatus ?? "",
    dependentChildren: row.dependent_children ?? row.dependentChildren ?? null,
    soloParentReason: row.solo_parent_reason ?? row.soloParentReason ?? "",
    crisisSummary: row.crisis_summary ?? row.crisisSummary ?? "",
    serviceProvider: row.service_provider ?? row.serviceProvider ?? "",
  };
}
