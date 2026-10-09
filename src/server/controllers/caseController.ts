import { pool } from '../db/client';

export interface CaseQueryFilters {
  status?: string;
  category?: string;
  aics_type?: string;
  search?: string;
  barangay?: string;
}

// 1. Fetch Women & Solo Parent Cases with Filters
export async function getWomenSoloParentCases(filters: CaseQueryFilters) {
  let query = 'SELECT * FROM women_and_solo_parent_cases WHERE 1=1';
  const params: any[] = [];
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
export async function getAicsCases(filters: CaseQueryFilters) {
  let query = 'SELECT * FROM aics_cases WHERE 1=1';
  const params: any[] = [];
  let paramIdx = 1;

  if (filters.status && filters.status.toUpperCase() !== 'ALL') {
    query += ` AND status = $${paramIdx++}`;
    params.push(filters.status.toUpperCase());
  }

  const typeFilter = filters.aics_type || filters.category;
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
export async function getCaseById(idOrCaseNumber: string, requestedModule?: string) {
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
export async function updateCaseStep(idOrCaseNumber: string, body: any) {
  // First identify whether this is women or aics case
  const existing = await getCaseById(idOrCaseNumber, body.moduleType || body.module);
  if (!existing) {
    throw new Error(`Case record '${idOrCaseNumber}' not found in database.`);
  }

  const tableName = existing.module === 'women-solo-parent' 
    ? 'women_and_solo_parent_cases' 
    : 'aics_cases';
  
  const idCol = /^\d+$/.test(idOrCaseNumber) ? 'id' : 'case_number';
  const targetId = idOrCaseNumber;

  const step = body.step ? Number(body.step) : undefined;
  const updates: string[] = [];
  const params: any[] = [];
  let paramIdx = 1;

  // 1. Status Update (Explicit status or triggered by Step)
  let newStatus = body.status;
  if (step === 1 && !newStatus) newStatus = 'UNDER_REVIEW';
  if (step === 4 && !newStatus) newStatus = 'ELIGIBILITY_EVALUATED';
  if (step === 6 && !newStatus) newStatus = 'APPROVED_FOR_RELEASE';
  if (step === 7 && !newStatus) newStatus = 'RELEASED_COMPLETED';
  if (step === 8 || body.isCaseClosed) newStatus = 'CASE_CLOSED';

  if (newStatus) {
    // Normalize status string to case_status_enum
    const normalizedStatus = newStatus.toUpperCase().replace(/\s+/g, '_');
    updates.push(`status = $${paramIdx++}`);
    params.push(normalizedStatus);
  }

  // 2. Documents Status (Step 2)
  if (body.documents_status !== undefined || body.documents !== undefined) {
    let docMap = body.documents_status;
    if (!docMap && Array.isArray(body.documents)) {
      docMap = {};
      body.documents.forEach((d: any) => {
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
      if (eligValue.includes('REFERRAL')) eligValue = 'FOR_REFERRAL';
      if (eligValue.includes('NOT')) eligValue = 'NOT_ELIGIBLE';
      if (eligValue === 'ELIGIBLE') eligValue = 'ELIGIBLE';
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
  let existingLogs: any[] = existing.caseData.monitoring_logs || [];
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
    };
    existingLogs = [...existingLogs, entry];
    logChanged = true;
  } else if (body.step && newStatus && newStatus !== existing.caseData.status) {
    // Automatically record status change in monitoring_logs
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

  // Execute the update
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
