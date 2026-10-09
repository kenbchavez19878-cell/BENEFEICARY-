import { pool } from '../db/client.js';

// 1. Fetch Women & Solo Parent Cases with Filters
export async function getWomenSoloParentCases(filters = {}) {
  let query = 'SELECT * FROM women_and_solo_parent_cases WHERE 1=1';
  const params = [];
  let paramIdx = 1;

  if (filters.status && filters.status.toUpperCase() !== 'ALL') {
    query += ` AND status = $${paramIdx++}`;
    params.push(filters.status.toUpperCase());
  }

  if (filters.category && filters.category.toUpperCase() !== 'ALL') {
    query += ` AND category = $${paramIdx++}`;
    params.push(filters.category.toUpperCase());
  }

  if (filters.barangay && filters.barangay.toUpperCase() !== 'ALL') {
    query += ` AND barangay_name ILIKE $${paramIdx++}`;
    params.push(`%${filters.barangay}%`);
  }

  if (filters.search && filters.search.trim() !== '') {
    const s = `%${filters.search.trim()}%`;
    query += ` AND (
      beneficiary_name ILIKE $${paramIdx} OR
      case_number ILIKE $${paramIdx} OR
      barangay_name ILIKE $${paramIdx} OR
      COALESCE(spic_number, '') ILIKE $${paramIdx}
    )`;
    params.push(s);
    paramIdx++;
  }

  query += ' ORDER BY id ASC';

  const result = await pool.query(query, params);
  return result.rows;
}

// 2. Fetch AICS Cases with Filters
export async function getAicsCases(filters = {}) {
  let query = 'SELECT * FROM aics_cases WHERE 1=1';
  const params = [];
  let paramIdx = 1;

  if (filters.status && filters.status.toUpperCase() !== 'ALL') {
    query += ` AND status = $${paramIdx++}`;
    params.push(filters.status.toUpperCase());
  }

  const typeFilter = filters.aics_type || filters.category || filters.type;
  if (typeFilter && typeFilter.toUpperCase() !== 'ALL') {
    query += ` AND aics_type = $${paramIdx++}`;
    params.push(typeFilter.toUpperCase());
  }

  if (filters.barangay && filters.barangay.toUpperCase() !== 'ALL') {
    query += ` AND barangay_name ILIKE $${paramIdx++}`;
    params.push(`%${filters.barangay}%`);
  }

  if (filters.search && filters.search.trim() !== '') {
    const s = `%${filters.search.trim()}%`;
    query += ` AND (
      beneficiary_name ILIKE $${paramIdx} OR
      case_number ILIKE $${paramIdx} OR
      barangay_name ILIKE $${paramIdx} OR
      COALESCE(guarantee_letter_number, '') ILIKE $${paramIdx}
    )`;
    params.push(s);
    paramIdx++;
  }

  query += ' ORDER BY id ASC';

  const result = await pool.query(query, params);
  return result.rows;
}

// 3. Fetch Single Case by ID or Case Number
export async function getCaseById(idOrCaseNumber, requestedModule) {
  const isNumeric = /^\d+$/.test(idOrCaseNumber);
  
  if (requestedModule === 'women-solo-parent' || requestedModule === 'solo-parent' || requestedModule === 'women-vawc') {
    const q = isNumeric
      ? 'SELECT *, \'women-solo-parent\' as module FROM women_and_solo_parent_cases WHERE id = $1'
      : 'SELECT *, \'women-solo-parent\' as module FROM women_and_solo_parent_cases WHERE case_number = $1';
    const res = await pool.query(q, [idOrCaseNumber]);
    if (res.rows.length > 0) {
      return { caseData: res.rows[0], module: 'women-solo-parent', auditLogs: res.rows[0].monitoring_logs || [] };
    }
  }

  if (requestedModule === 'aics') {
    const q = isNumeric
      ? 'SELECT *, \'aics\' as module FROM aics_cases WHERE id = $1'
      : 'SELECT *, \'aics\' as module FROM aics_cases WHERE case_number = $1';
    const res = await pool.query(q, [idOrCaseNumber]);
    if (res.rows.length > 0) {
      return { caseData: res.rows[0], module: 'aics', auditLogs: res.rows[0].monitoring_logs || [] };
    }
  }

  // If module not specified, search women table first
  let q = isNumeric
    ? 'SELECT *, \'women-solo-parent\' as module FROM women_and_solo_parent_cases WHERE id = $1'
    : 'SELECT *, \'women-solo-parent\' as module FROM women_and_solo_parent_cases WHERE case_number = $1';
  let res = await pool.query(q, [idOrCaseNumber]);
  if (res.rows.length > 0) {
    return { caseData: res.rows[0], module: 'women-solo-parent', auditLogs: res.rows[0].monitoring_logs || [] };
  }

  // Try AICS table
  q = isNumeric
    ? 'SELECT *, \'aics\' as module FROM aics_cases WHERE id = $1'
    : 'SELECT *, \'aics\' as module FROM aics_cases WHERE case_number = $1';
  res = await pool.query(q, [idOrCaseNumber]);
  if (res.rows.length > 0) {
    return { caseData: res.rows[0], module: 'aics', auditLogs: res.rows[0].monitoring_logs || [] };
  }

  return null;
}

// 4. Update Case Step Data (Steps 1 to 8)
export async function updateCaseStep(idOrCaseNumber, body = {}) {
  const existing = await getCaseById(idOrCaseNumber, body.moduleType || body.module);
  if (!existing) {
    throw new Error(`Case record '${idOrCaseNumber}' not found in database.`);
  }

  const tableName = existing.module === 'women-solo-parent' 
    ? 'women_and_solo_parent_cases' 
    : 'aics_cases';
  
  const idCol = /^\d+$/.test(idOrCaseNumber) ? 'id' : 'case_number';
  const targetId = idOrCaseNumber;

  const step = body.step !== undefined ? Number(body.step) : undefined;
  const updates = [];
  const params = [];
  let paramIdx = 1;

  // 1. Status Update (Explicit status or triggered by Step)
  let newStatus = body.status;
  if (step === 1 && !newStatus) newStatus = 'UNDER_REVIEW';
  if (step === 4 && !newStatus) newStatus = 'ELIGIBILITY_EVALUATED';
  if (step === 6 && !newStatus) newStatus = 'APPROVED_FOR_RELEASE';
  if (step === 7 && !newStatus) newStatus = 'RELEASED_COMPLETED';
  if (step === 8 || body.isCaseClosed) newStatus = 'CASE_CLOSED';

  if (newStatus) {
    const normalizedStatus = newStatus.toUpperCase().replace(/\s+/g, '_');
    updates.push(`status = $${paramIdx++}`);
    params.push(normalizedStatus);
  }

  // 2. Documents Status (Step 2)
  if (body.documents_status !== undefined || body.documents !== undefined) {
    let docMap = body.documents_status;
    if (!docMap && Array.isArray(body.documents)) {
      docMap = {};
      body.documents.forEach((d) => {
        if (d.id) docMap[d.id] = d.status;
        if (d.name) docMap[d.name] = d.status;
      });
    }
    updates.push(`documents_status = $${paramIdx++}::jsonb`);
    params.push(JSON.stringify(docMap));
  }

  // 3. Social Assessment (Step 3)
  if (body.assessment_notes !== undefined) {
    updates.push(`assessment_notes = $${paramIdx++}`);
    params.push(body.assessment_notes);
  } else if (body.socialAssessment?.caseStudySummary || body.socialAssessment?.intakeNotes) {
    const combinedNotes = [
      body.socialAssessment?.intakeNotes ? `Intake: ${body.socialAssessment.intakeNotes}` : null,
      body.socialAssessment?.caseStudySummary ? `Assessment: ${body.socialAssessment.caseStudySummary}` : null
    ].filter(Boolean).join('\n\n');
    updates.push(`assessment_notes = $${paramIdx++}`);
    params.push(combinedNotes);
  }

  if (tableName === 'women_and_solo_parent_cases') {
    if (body.vulnerability_level !== undefined) {
      updates.push(`vulnerability_level = $${paramIdx++}`);
      params.push(body.vulnerability_level ? body.vulnerability_level.toUpperCase() : null);
    } else if (body.socialAssessment?.vulnerabilityLevel) {
      updates.push(`vulnerability_level = $${paramIdx++}`);
      params.push(body.socialAssessment.vulnerabilityLevel.toUpperCase());
    }
  }

  // 4. Eligibility Decision (Step 4)
  if (body.eligibility !== undefined) {
    let eligValue = typeof body.eligibility === 'string' ? body.eligibility : body.eligibility?.status;
    if (eligValue) {
      eligValue = eligValue.toUpperCase().replace(/\s+/g, '_');
      if (eligValue.includes('ADDITIONAL')) eligValue = 'ADDITIONAL_REQUIREMENTS';
      else if (eligValue.includes('REFERRAL')) eligValue = 'FOR_REFERRAL';
      else if (eligValue.includes('NOT')) eligValue = 'NOT_ELIGIBLE';
      else if (eligValue === 'ELIGIBLE') eligValue = 'ELIGIBLE';
      updates.push(`eligibility = $${paramIdx++}`);
      params.push(eligValue);
    }
  }

  // 5. Service Planning (Step 5)
  if (tableName === 'women_and_solo_parent_cases') {
    if (body.spic_number !== undefined || body.servicePlan?.spicNumber !== undefined) {
      updates.push(`spic_number = $${paramIdx++}`);
      params.push(body.spic_number || body.servicePlan?.spicNumber || null);
    }
    if (body.booklet_number !== undefined || body.servicePlan?.purchaseBookletNumber !== undefined) {
      updates.push(`booklet_number = $${paramIdx++}`);
      params.push(body.booklet_number || body.servicePlan?.purchaseBookletNumber || null);
    }
    if (body.financial_aid_amount !== undefined || body.servicePlan?.emergencyCashAidAmount !== undefined) {
      const amt = body.financial_aid_amount ?? body.servicePlan?.emergencyCashAidAmount;
      updates.push(`financial_aid_amount = $${paramIdx++}`);
      params.push(amt ? Number(amt) : null);
    }
    if (body.referrals !== undefined || body.servicePlan?.referrals !== undefined) {
      const ref = body.referrals ?? body.servicePlan?.referrals ?? [];
      updates.push(`referrals = $${paramIdx++}::jsonb`);
      params.push(JSON.stringify(ref));
    }
  } else {
    // AICS specific fields
    if (body.approved_amount !== undefined || body.servicePlan?.approvedFinancialAmount !== undefined) {
      const amt = body.approved_amount ?? body.servicePlan?.approvedFinancialAmount;
      updates.push(`approved_amount = $${paramIdx++}`);
      params.push(amt ? Number(amt) : null);
    }
    if (body.guarantee_letter_number !== undefined || body.serviceRelease?.guaranteeLetterNumber !== undefined) {
      updates.push(`guarantee_letter_number = $${paramIdx++}`);
      params.push(body.guarantee_letter_number || body.serviceRelease?.guaranteeLetterNumber || null);
    }
    if (body.aics_type !== undefined || body.servicePlan?.crisisType !== undefined) {
      const t = (body.aics_type || body.servicePlan?.crisisType).toUpperCase().replace(/\s+/g, '_');
      updates.push(`aics_type = $${paramIdx++}`);
      params.push(t);
    }
  }

  // 6. Release & Disbursement (Step 7)
  if (body.release_method !== undefined || body.serviceRelease?.releaseMethod !== undefined) {
    let rel = body.release_method || body.serviceRelease?.releaseMethod;
    if (rel) {
      rel = rel.toUpperCase();
      if (rel.includes('GL') || rel.includes('GUARANTEE')) rel = 'GUARANTEE_LETTER';
      else if (rel.includes('CHECK')) rel = 'CHECK';
      else rel = 'CASH';
      updates.push(`release_method = $${paramIdx++}`);
      params.push(rel);
    }
  }
  if (body.payout_date !== undefined || body.serviceRelease?.payoutDate !== undefined) {
    const pDate = body.payout_date || body.serviceRelease?.payoutDate;
    if (pDate) {
      updates.push(`payout_date = $${paramIdx++}`);
      params.push(pDate);
    }
  }

  // 7. Timeline / Monitoring Logs (Step 8 & activity audit logging)
  let existingLogs = existing.caseData.monitoring_logs || [];
  let logChanged = false;

  // New single activity/note log entry
  if (body.new_log_entry || body.newFollowUpNote) {
    const entry = body.new_log_entry || {
      id: `tl-${Date.now()}`,
      date: new Date().toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
      author: body.author || 'MSWD Case Officer',
      title: body.title || 'Follow-Up / Monitoring Note',
      description: body.newFollowUpNote || body.description,
      type: body.logType || 'note',
      timestamp: new Date().toISOString(),
    };
    existingLogs = [...existingLogs, entry];
    logChanged = true;
  } else if (body.step && newStatus && newStatus !== existing.caseData.status) {
    const auditEntry = {
      id: `tl-step-${step}-${Date.now()}`,
      date: new Date().toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
      author: body.author || 'MSWD Case Officer',
      title: `Step ${step}: Status updated to ${newStatus}`,
      description: body.stepNotes || `Case advanced to step ${step}. Status changed to ${newStatus}.`,
      type: 'status',
      timestamp: new Date().toISOString(),
    };
    existingLogs = [...existingLogs, auditEntry];
    logChanged = true;
  }

  // Full timeline replacement if provided directly
  if (body.monitoring_logs !== undefined) {
    existingLogs = Array.isArray(body.monitoring_logs) ? body.monitoring_logs : existingLogs;
    logChanged = true;
  } else if (body.timeline !== undefined) {
    existingLogs = Array.isArray(body.timeline) ? body.timeline : existingLogs;
    logChanged = true;
  }

  if (logChanged) {
    updates.push(`monitoring_logs = $${paramIdx++}::jsonb`);
    params.push(JSON.stringify(existingLogs));
  }

  if (updates.length === 0) {
    return existing.caseData;
  }

  updates.push('updated_at = NOW()');

  const updateQuery = `
    UPDATE ${tableName}
    SET ${updates.join(', ')}
    WHERE ${idCol} = $${paramIdx}
    RETURNING *;
  `;
  params.push(targetId);

  const updateResult = await pool.query(updateQuery, params);
  return updateResult.rows[0];
}

// 5. Create New Women & Solo Parent Case (POST /api/cases/women-solo-parent)
export async function createWomenSoloParentCase(data = {}) {
  const caseNumber = data.case_number || data.caseNumber || `BEN-2026-${Math.floor(100000 + Math.random() * 900000)}`;
  const beneficiaryName = (data.beneficiary_name || data.fullName || '').trim();
  if (!beneficiaryName) {
    throw new Error('Beneficiary full name is required and cannot be blank.');
  }
  const barangayName = (data.barangay_name || data.barangay || 'San Juan').trim();
  const category = (data.category || 'SOLO_PARENT').toUpperCase().includes('VAWC') ? 'WOMEN_VAWC' : 'SOLO_PARENT';
  const status = (data.status || 'BARANGAY_ENDORSED').toUpperCase().replace(/\s+/g, '_');
  const eligibility = data.eligibility || 'ELIGIBLE';
  
  const documentsStatus = data.documents_status || {
    "PSA Child Birth Certificate": "Valid",
    "Proof of Solo Parent Status": "Valid",
    "Barangay Indigency": "Valid"
  };

  const initialNotes = data.assessment_notes || data.intakeNotes || `Initial registration for ${category === 'SOLO_PARENT' ? 'Solo Parent' : 'Women VAWC'} assistance. Reason: ${data.solo_parent_reason || 'Support needed'}.`;

  const vulnerability = (data.vulnerability_level || 'MODERATE').toUpperCase();
  const contactNumber = data.contact_number || data.contactNumber || null;
  const civilStatus = data.civil_status || data.civilStatus || 'Single Parent';
  const birthDate = data.birth_date || data.birthDate || null;
  const gender = data.gender || 'Female';
  const indigencyLevel = data.indigency_level || data.indigencyLevel || 'Low Income / Indigent';
  const dependentChildren = data.dependent_children ? parseInt(data.dependent_children, 10) : 0;
  const soloParentReason = data.solo_parent_reason || data.soloParentReason || null;
  const financialAidAmount = data.financial_aid_amount ? parseFloat(data.financial_aid_amount) : 3000.00;
  const spicNumber = data.spic_number || (category === 'SOLO_PARENT' ? `SPIC-2026-${Math.floor(1000 + Math.random() * 9000)}` : null);
  const bookletNumber = data.booklet_number || (category === 'SOLO_PARENT' ? `BK-2026-${Math.floor(1000 + Math.random() * 9000)}` : null);
  const referrals = data.referrals || ["Livelihood Skills Training", "Parenting Effectiveness Seminar (PES)"];

  const initialLogs = [
    {
      id: `tl-${Date.now()}`,
      date: new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }),
      author: data.author || 'Barangay Registrar',
      title: 'New Beneficiary Registration & Profiling',
      description: `New ${category === 'SOLO_PARENT' ? 'Solo Parent' : 'Women VAWC'} profile registered for ${beneficiaryName} from Barangay ${barangayName}.`,
      type: 'status',
      timestamp: new Date().toISOString(),
    }
  ];

  const query = `
    INSERT INTO women_and_solo_parent_cases (
      case_number, beneficiary_name, barangay_name, category, status, eligibility,
      documents_status, assessment_notes, vulnerability_level, spic_number, booklet_number,
      financial_aid_amount, referrals, monitoring_logs, contact_number, civil_status,
      birth_date, gender, indigency_level, dependent_children, solo_parent_reason
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
    RETURNING *;
  `;

  const values = [
    caseNumber, beneficiaryName, barangayName, category, status, eligibility,
    JSON.stringify(documentsStatus), initialNotes, vulnerability, spicNumber, bookletNumber,
    financialAidAmount, JSON.stringify(referrals), JSON.stringify(initialLogs), contactNumber, civilStatus,
    birthDate, gender, indigencyLevel, dependentChildren, soloParentReason
  ];

  const res = await pool.query(query, values);
  return res.rows[0];
}

// 6. Create New AICS Case (POST /api/cases/aics)
export async function createAicsCase(data = {}) {
  const caseNumber = data.case_number || data.caseNumber || `AICS-2026-${Math.floor(100000 + Math.random() * 900000)}`;
  const beneficiaryName = (data.beneficiary_name || data.fullName || '').trim();
  if (!beneficiaryName) {
    throw new Error('Beneficiary full name is required and cannot be blank.');
  }
  const barangayName = (data.barangay_name || data.barangay || 'San Juan').trim();
  const aicsType = (data.aics_type || data.crisisType || 'MEDICAL').toUpperCase().replace(/\s+/g, '_');
  const status = (data.status || 'BARANGAY_ENDORSED').toUpperCase().replace(/\s+/g, '_');
  const eligibility = data.eligibility || 'ELIGIBLE';

  const documentsStatus = data.documents_status || {
    "Valid ID": "Valid",
    "Indigency": "Valid"
  };

  const initialNotes = data.assessment_notes || data.crisis_summary || data.crisisSummary || `Initial emergency intake for ${aicsType} assistance.`;
  const approvedAmount = data.approved_amount || data.requested_amount || 5000.00;
  const releaseMethod = data.release_method || (aicsType === 'MEDICAL' ? 'GUARANTEE_LETTER' : 'CASH');
  const glNumber = releaseMethod === 'GUARANTEE_LETTER' ? (data.guarantee_letter_number || `GL-CAL-2026-${Math.floor(10000 + Math.random() * 90000)}`) : null;

  const contactNumber = data.contact_number || data.contactNumber || null;
  const civilStatus = data.civil_status || data.civilStatus || 'Resident Client';
  const birthDate = data.birth_date || data.birthDate || null;
  const incomeStatus = data.income_status || data.incomeStatus || 'Indigent / Crisis';
  const serviceProvider = data.service_provider || data.serviceProvider || null;
  const crisisSummary = data.crisis_summary || data.crisisSummary || initialNotes;

  const initialLogs = [
    {
      id: `tl-${Date.now()}`,
      date: new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }),
      author: data.author || 'Barangay Registrar',
      title: 'New AICS Crisis Intake & Registration',
      description: `New AICS intake for ${beneficiaryName} from Barangay ${barangayName} (${aicsType}).`,
      type: 'status',
      timestamp: new Date().toISOString(),
    }
  ];

  const query = `
    INSERT INTO aics_cases (
      case_number, beneficiary_name, barangay_name, aics_type, status, eligibility,
      documents_status, assessment_notes, approved_amount, release_method, guarantee_letter_number,
      monitoring_logs, contact_number, civil_status, birth_date, income_status, service_provider, crisis_summary
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
    RETURNING *;
  `;

  const values = [
    caseNumber, beneficiaryName, barangayName, aicsType, status, eligibility,
    JSON.stringify(documentsStatus), initialNotes, approvedAmount, releaseMethod, glNumber,
    JSON.stringify(initialLogs), contactNumber, civilStatus, birthDate, incomeStatus, serviceProvider, crisisSummary
  ];

  const res = await pool.query(query, values);
  return res.rows[0];
}

// 7. Get Comprehensive Dashboard Statistics (GET /api/dashboard/stats)
export async function getDashboardStats() {
  const womenRes = await pool.query('SELECT * FROM women_and_solo_parent_cases');
  const aicsRes = await pool.query('SELECT * FROM aics_cases');

  const womenRows = womenRes.rows;
  const aicsRows = aicsRes.rows;
  const allCases = [...womenRows, ...aicsRows];

  // 1. Total Beneficiaries
  const totalBeneficiaries = allCases.length;

  // 2. Active / Pending Cases: BARANGAY_ENDORSED, UNDER_REVIEW, IN_ASSESSMENT
  const activeCases = allCases.filter(c => 
    ['BARANGAY_ENDORSED', 'UNDER_REVIEW', 'IN_ASSESSMENT'].includes(c.status)
  ).length;

  // 3. Approved / Released Cases: APPROVED_FOR_RELEASE, RELEASED_COMPLETED, CASE_CLOSED
  const approvedReleasedCases = allCases.filter(c => 
    ['APPROVED_FOR_RELEASE', 'RELEASED_COMPLETED', 'CASE_CLOSED'].includes(c.status)
  ).length;

  // 4. Total Financial Aid Disbursed (PHP)
  let totalDisbursed = 0;
  womenRows.forEach(c => {
    if (['RELEASED_COMPLETED', 'CASE_CLOSED'].includes(c.status)) {
      totalDisbursed += Number(c.financial_aid_amount) || 0;
    }
  });
  aicsRows.forEach(c => {
    if (['RELEASED_COMPLETED', 'CASE_CLOSED'].includes(c.status)) {
      totalDisbursed += Number(c.approved_amount) || 0;
    }
  });

  // 5. Category Breakdown (Solo Parent vs Women VAWC)
  const soloParentCount = womenRows.filter(c => c.category === 'SOLO_PARENT').length;
  const womenVawcCount = womenRows.filter(c => c.category === 'WOMEN_VAWC').length;

  // 6. AICS Crisis Type Distribution
  const aicsTypeCounts = {};
  aicsRows.forEach(c => {
    const t = c.aics_type || 'MEDICAL';
    aicsTypeCounts[t] = (aicsTypeCounts[t] || 0) + 1;
  });

  // 7. Barangay Distribution
  const brgyCounts = {};
  allCases.forEach(c => {
    const b = c.barangay_name || 'San Juan';
    brgyCounts[b] = (brgyCounts[b] || 0) + 1;
  });
  const barangayDistribution = Object.entries(brgyCounts)
    .map(([barangay, count]) => ({ barangay, count }))
    .sort((a, b) => b.count - a.count);

  // 8. Recent Activities Feed
  const recentActivities = [];
  allCases.forEach(c => {
    const isWomen = 'category' in c;
    const progName = isWomen 
      ? (c.category === 'SOLO_PARENT' ? 'Solo Parent Assistance' : 'Women VAWC Protection')
      : `AICS (${(c.aics_type || 'Medical').replace(/_/g, ' ')})`;

    const logs = Array.isArray(c.monitoring_logs) ? c.monitoring_logs : [];
    logs.forEach(log => {
      recentActivities.push({
        id: log.id || `act-${Math.random()}`,
        clientName: c.beneficiary_name,
        clientId: c.case_number,
        program: progName,
        barangay: c.barangay_name,
        date: log.date || 'Recent',
        time: '',
        title: log.title || 'Case Update',
        description: log.description || '',
        status: c.status,
        statusLabel: c.status ? c.status.replace(/_/g, ' ') : 'Updated',
        author: log.author || 'MSWD Officer',
        timestamp: log.timestamp || c.updated_at || c.created_at,
      });
    });
  });

  // Sort activities newest first and cap at 10
  recentActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const cappedActivities = recentActivities.slice(0, 10);

  return {
    totalBeneficiaries,
    activeCases,
    approvedReleasedCases,
    totalDisbursed,
    categoryBreakdown: [
      { name: 'Solo Parent', value: soloParentCount, color: '#10b981' },
      { name: 'Women / VAWC', value: womenVawcCount, color: '#a855f7' },
      { name: 'AICS Medical', value: aicsTypeCounts['MEDICAL'] || 0, color: '#3b82f6' },
      { name: 'AICS Burial', value: aicsTypeCounts['BURIAL'] || 0, color: '#f97316' },
      { name: 'AICS Other', value: (aicsTypeCounts['TRANSPORTATION'] || 0) + (aicsTypeCounts['ECONOMIC_RELIEF'] || 0) + (aicsTypeCounts['BALIK_PROBINSYA'] || 0), color: '#06b6d4' },
    ],
    aicsBreakdown: [
      { name: 'Medical', value: aicsTypeCounts['MEDICAL'] || 0, color: '#3b82f6' },
      { name: 'Burial', value: aicsTypeCounts['BURIAL'] || 0, color: '#f97316' },
      { name: 'Transportation', value: aicsTypeCounts['TRANSPORTATION'] || 0, color: '#eab308' },
      { name: 'Economic Relief', value: aicsTypeCounts['ECONOMIC_RELIEF'] || 0, color: '#10b981' },
      { name: 'Balik Probinsya', value: aicsTypeCounts['BALIK_PROBINSYA'] || 0, color: '#8b5cf6' },
    ],
    barangayDistribution,
    recentActivities: cappedActivities,
  };
}
