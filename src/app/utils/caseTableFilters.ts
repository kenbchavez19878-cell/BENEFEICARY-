interface FilterableCase {
  beneficiaryName: string;
  trackingId: string;
  barangay: string;
  status: string;
  profileType: string;
  rawDbRow?: { status?: string };
  fullInfo?: { registrationType?: string };
}

export function matchesCaseTableFilters(record: FilterableCase, search: string, status: string, profileType: string) {
  const query = search.trim().toLowerCase();
  const matchesSearch = [record.beneficiaryName, record.trackingId, record.barangay]
    .some(value => (value || '').toLowerCase().includes(query));
  const statusCode = record.rawDbRow?.status;
  const matchesStatus = status === 'all'
    || (status === 'Pending Verification' && statusCode === 'BARANGAY_ENDORSED')
    || (status === 'Verified' && statusCode === 'IN_ASSESSMENT')
    || record.status.toLowerCase().includes(status.toLowerCase());
  const matchesType = profileType === 'all'
    || (record.fullInfo?.registrationType || '').toLowerCase().includes(profileType.toLowerCase())
    || record.profileType.toLowerCase().includes(profileType.toLowerCase());
  return matchesSearch && matchesStatus && matchesType;
}
