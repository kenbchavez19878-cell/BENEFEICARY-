-- Seed Data: 001_seed_cases.sql
-- Description: Realistic initial data for Women & Solo Parent and AICS modules

-- 1. Insert Women & Solo Parent Cases
INSERT INTO women_and_solo_parent_cases (
    case_number,
    beneficiary_name,
    barangay_name,
    category,
    status,
    eligibility,
    documents_status,
    assessment_notes,
    vulnerability_level,
    spic_number,
    booklet_number,
    financial_aid_amount,
    referrals,
    release_method,
    payout_date,
    monitoring_logs
) VALUES 
(
    'BEN-2026-000125',
    'Reyes, Maria Santos',
    'San Juan',
    'SOLO_PARENT',
    'BARANGAY_ENDORSED',
    'ELIGIBLE',
    '{"sp-1": "Valid", "sp-2": "Valid", "sp-3": "Valid", "PSA Child Birth Certificate": "Valid", "Proof of Solo Parent Status": "Valid", "Barangay Indigency": "Valid"}'::jsonb,
    'Client appeared for intake interview. Solo provider managing household with dependent minors. Minimal informal livelihood income. Social Case Study Report indicates client falls below indigency baseline.',
    'HIGH',
    'SPIC-2026-1082',
    'BK-2026-0842',
    3000.00,
    '["Livelihood Skills Training", "Parenting Effectiveness Seminar (PES)"]'::jsonb,
    'CASH',
    '2026-10-15',
    '[
        {"id": "tl-1", "date": "2026-10-01 09:15 AM", "author": "Barangay Secretary", "title": "Barangay Endorsement Recorded", "description": "Case forwarded from Barangay San Juan to Municipal MSWD Office.", "type": "status"},
        {"id": "tl-2", "date": "2026-10-03 01:45 PM", "author": "Juan Miguel Ramos, RSW", "title": "Initial Intake Interview", "description": "Client assessment conducted and social case study notes filed.", "type": "visit"}
    ]'::jsonb
),
(
    'BEN-2026-000126',
    'Dela Cruz, Ana Gomez',
    'San Roque',
    'WOMEN_VAWC',
    'UNDER_REVIEW',
    'ELIGIBLE',
    '{"w-1": "Valid", "w-2": "Valid", "w-3": "Incomplete", "w-4": "Valid", "Valid ID": "Valid", "BPO/Police Blotter": "Valid", "Medico-Legal Report": "Incomplete", "Barangay Indigency": "Valid"}'::jsonb,
    'Urgent protective and legal counseling case. BPO granted by Punong Barangay. Coordinated with PNP Women and Children Protection Desk for psychosocial accompaniment.',
    'HIGH',
    NULL,
    NULL,
    5000.00,
    '["Legal Assistance (PAO)", "Psychosocial Counseling", "Emergency Shelter Assistance"]'::jsonb,
    'CHECK',
    '2026-10-18',
    '[
        {"id": "tl-1", "date": "2026-10-04 10:00 AM", "author": "Barangay Secretary", "title": "BPO Endorsement", "description": "Emergency referral endorsed from Barangay San Roque.", "type": "status"},
        {"id": "tl-2", "date": "2026-10-05 11:30 AM", "author": "MSWD Case Officer", "title": "Safety & Needs Assessment", "description": "Intake completed with VAWC desk officer.", "type": "note"}
    ]'::jsonb
),
(
    'BEN-2026-000127',
    'Alcantara, Elena Perez',
    'Salvacion',
    'SOLO_PARENT',
    'IN_ASSESSMENT',
    'ELIGIBLE',
    '{"sp-1": "Valid", "sp-2": "Valid", "sp-3": "Valid"}'::jsonb,
    'Solo mother of 3 school-age children. Applied for Solo Parent ID Card (SPIC) renewal and municipal educational support assistance.',
    'MODERATE',
    'SPIC-2026-4412',
    'BK-2026-1903',
    3500.00,
    '["Sustainable Livelihood Program (SLP)", "PES Module"]'::jsonb,
    'CASH',
    '2026-10-20',
    '[
        {"id": "tl-1", "date": "2026-10-02 08:30 AM", "author": "Barangay Secretary", "title": "Endorsed from Salvacion", "description": "Documents validated by Barangay Registrar.", "type": "status"}
    ]'::jsonb
),
(
    'BEN-2026-000128',
    'Morales, Christine Jane',
    'Sta. Cruz',
    'SOLO_PARENT',
    'ELIGIBILITY_EVALUATED',
    'ELIGIBLE',
    '{"sp-1": "Valid", "sp-2": "Valid", "sp-3": "Valid"}'::jsonb,
    'Eligible under RA 11861. All legal affidavits of non-support verified by municipal social worker.',
    'LOW',
    'SPIC-2026-8821',
    'BK-2026-3392',
    3000.00,
    '["PES Module"]'::jsonb,
    'CASH',
    '2026-10-22',
    '[
        {"id": "tl-1", "date": "2026-09-28 09:00 AM", "author": "Barangay Secretary", "title": "Endorsed", "description": "Submitted at Sta. Cruz Barangay Hall.", "type": "status"},
        {"id": "tl-2", "date": "2026-10-06 02:00 PM", "author": "Social Worker", "title": "Eligibility Approved", "description": "Passed comprehensive assessment criteria.", "type": "status"}
    ]'::jsonb
),
(
    'BEN-2026-000129',
    'Bautista, Clarissa Mendoza',
    'Paolbo',
    'WOMEN_VAWC',
    'APPROVED_FOR_RELEASE',
    'ELIGIBLE',
    '{"w-1": "Valid", "w-2": "Valid", "w-3": "Valid", "w-4": "Valid"}'::jsonb,
    'Case evaluation finalized. Approved for financial aid and continuing livelihood rehabilitation.',
    'HIGH',
    NULL,
    NULL,
    6000.00,
    '["PES Module", "SLP Livelihood Seed Capital"]'::jsonb,
    'CHECK',
    '2026-10-25',
    '[
        {"id": "tl-1", "date": "2026-10-01 10:15 AM", "author": "Barangay Secretary", "title": "Endorsed", "description": "Transmitted to MSWD Calabanga.", "type": "status"},
        {"id": "tl-2", "date": "2026-10-07 03:30 PM", "author": "MSWD Head", "title": "Approved For Release", "description": "Voucher signed and forwarded to municipal treasury.", "type": "status"}
    ]'::jsonb
),
(
    'BEN-2026-000130',
    'Soriano, Marites Ramos',
    'Manguiring',
    'SOLO_PARENT',
    'RELEASED_COMPLETED',
    'ELIGIBLE',
    '{"sp-1": "Valid", "sp-2": "Valid", "sp-3": "Valid"}'::jsonb,
    'Solo parent ID, booklet, and educational cash assistance released to client.',
    'MODERATE',
    'SPIC-2026-9041',
    'BK-2026-5510',
    4000.00,
    '["Livelihood Skills Training"]'::jsonb,
    'CASH',
    '2026-10-08',
    '[
        {"id": "tl-1", "date": "2026-09-20 09:30 AM", "author": "Barangay Secretary", "title": "Endorsement Filed", "description": "Case initiated.", "type": "status"},
        {"id": "tl-2", "date": "2026-10-08 10:00 AM", "author": "Disbursing Officer", "title": "Cash Aid & SPIC Released", "description": "Cash payout completed with signed acknowledgement receipt.", "type": "status"}
    ]'::jsonb
)
ON CONFLICT (case_number) DO UPDATE SET
    beneficiary_name = EXCLUDED.beneficiary_name,
    barangay_name = EXCLUDED.barangay_name,
    category = EXCLUDED.category,
    status = EXCLUDED.status,
    eligibility = EXCLUDED.eligibility,
    documents_status = EXCLUDED.documents_status,
    assessment_notes = EXCLUDED.assessment_notes,
    vulnerability_level = EXCLUDED.vulnerability_level,
    spic_number = EXCLUDED.spic_number,
    booklet_number = EXCLUDED.booklet_number,
    financial_aid_amount = EXCLUDED.financial_aid_amount,
    referrals = EXCLUDED.referrals,
    release_method = EXCLUDED.release_method,
    payout_date = EXCLUDED.payout_date,
    monitoring_logs = EXCLUDED.monitoring_logs;

-- 2. Insert AICS Cases
INSERT INTO aics_cases (
    case_number,
    beneficiary_name,
    barangay_name,
    aics_type,
    status,
    eligibility,
    documents_status,
    assessment_notes,
    approved_amount,
    release_method,
    guarantee_letter_number,
    payout_date,
    monitoring_logs
) VALUES 
(
    'AICS-2026-000101',
    'Villanueva, Roberto Carlos',
    'San Bernardino',
    'MEDICAL',
    'BARANGAY_ENDORSED',
    'ELIGIBLE',
    '{"a-1": "Valid", "a-2": "Valid", "a-3": "Valid", "a-4": "Valid", "a-5": "Incomplete", "a-6": "Incomplete", "Valid ID": "Valid", "Indigency": "Valid", "Hospital SOA/Bills": "Valid", "Doctor''s Prescription": "Valid"}'::jsonb,
    'Patient undergoing ongoing chemotherapy sessions at BMC Naga. High medical expense burden on indigent household. Recommended for Medical Guarantee Letter assistance.',
    5000.00,
    'GUARANTEE_LETTER',
    'GL-CAL-2026-00452',
    '2026-10-14',
    '[
        {"id": "tl-1", "date": "2026-10-02 08:45 AM", "author": "Barangay Secretary", "title": "Medical Assistance Endorsement", "description": "Barangay endorsement and medical certificate submitted.", "type": "status"},
        {"id": "tl-2", "date": "2026-10-04 02:00 PM", "author": "MSWD Case Officer", "title": "Hospital Bills Validated", "description": "Verified outstanding hospital billing statement with billing section.", "type": "note"}
    ]'::jsonb
),
(
    'AICS-2026-000102',
    'Mercado, Teresa Santos',
    'Sabang',
    'BURIAL',
    'UNDER_REVIEW',
    'ELIGIBLE',
    '{"a-1": "Valid", "a-2": "Valid", "a-3": "Incomplete", "a-4": "Incomplete", "a-5": "Valid", "a-6": "Incomplete", "Death Cert / Funeral Contract": "Valid"}'::jsonb,
    'Bereaved family requesting urgent burial financial assistance for deceased head of family. Funeral contract submitted.',
    7000.00,
    'CASH',
    NULL,
    '2026-10-16',
    '[
        {"id": "tl-1", "date": "2026-10-03 11:20 AM", "author": "Barangay Secretary", "title": "Burial Assistance Endorsed", "description": "Death certificate and indigent certification transmitted.", "type": "status"}
    ]'::jsonb
),
(
    'AICS-2026-000103',
    'Fernandez, Danilo Lopez',
    'San Francisco',
    'TRANSPORTATION',
    'IN_ASSESSMENT',
    'ELIGIBLE',
    '{"a-1": "Valid", "a-2": "Valid", "a-3": "Incomplete", "a-4": "Incomplete", "a-5": "Incomplete", "a-6": "Valid", "Transit Request": "Valid"}'::jsonb,
    'Stranded individual requesting inter-provincial bus transit assistance back to Samar province following project completion.',
    2500.00,
    'CASH',
    NULL,
    '2026-10-15',
    '[
        {"id": "tl-1", "date": "2026-10-05 09:10 AM", "author": "Barangay Secretary", "title": "Transit Referral Forwarded", "description": "Client requested municipal transit ticket subsidy.", "type": "status"}
    ]'::jsonb
),
(
    'AICS-2026-000104',
    'Castillo, Remedios Tan',
    'Balongay',
    'ECONOMIC_RELIEF',
    'ELIGIBILITY_EVALUATED',
    'ELIGIBLE',
    '{"a-1": "Valid", "a-2": "Valid"}'::jsonb,
    'Severe income disruption due to coastal monsoon squall. Indigent fisherfolk household assessed for emergency economic relief voucher.',
    4000.00,
    'CASH',
    NULL,
    '2026-10-19',
    '[
        {"id": "tl-1", "date": "2026-09-30 02:00 PM", "author": "Barangay Secretary", "title": "Calamity Referral", "description": "Endorsed under emergency economic relief program.", "type": "status"}
    ]'::jsonb
),
(
    'AICS-2026-000105',
    'Navarro, Jose Mari',
    'Comaguingking',
    'BALIK_PROBINSYA',
    'APPROVED_FOR_RELEASE',
    'ELIGIBLE',
    '{"a-1": "Valid", "a-2": "Valid", "a-6": "Valid"}'::jsonb,
    'Balik Probinsya relocation package verified. Coordinated with destination LGU social services department.',
    8000.00,
    'CHECK',
    NULL,
    '2026-10-21',
    '[
        {"id": "tl-1", "date": "2026-09-25 10:00 AM", "author": "Barangay Secretary", "title": "Endorsed BP2 Application", "description": "Household relocation and reintegration requested.", "type": "status"},
        {"id": "tl-2", "date": "2026-10-07 04:00 PM", "author": "MSWD Head", "title": "Financial Aid Voucher Approved", "description": "Check release approved for transit and transitional food pack.", "type": "status"}
    ]'::jsonb
),
(
    'AICS-2026-000106',
    'Aquino, Shirley Cruz',
    'Dominorog',
    'MEDICAL',
    'RELEASED_COMPLETED',
    'ELIGIBLE',
    '{"a-1": "Valid", "a-2": "Valid", "a-3": "Valid", "a-4": "Valid"}'::jsonb,
    'Hospital dialysis Guarantee Letter successfully issued and honored at partner hemodialysis medical center.',
    6000.00,
    'GUARANTEE_LETTER',
    'GL-CAL-2026-00389',
    '2026-10-06',
    '[
        {"id": "tl-1", "date": "2026-09-18 09:00 AM", "author": "Barangay Secretary", "title": "Endorsement Received", "description": "Dialysis case endorsed.", "type": "status"},
        {"id": "tl-2", "date": "2026-10-06 01:30 PM", "author": "Disbursing Officer", "title": "Guarantee Letter Released", "description": "GL issued to patient relative with counter-signed voucher.", "type": "status"}
    ]'::jsonb
)
ON CONFLICT (case_number) DO UPDATE SET
    beneficiary_name = EXCLUDED.beneficiary_name,
    barangay_name = EXCLUDED.barangay_name,
    aics_type = EXCLUDED.aics_type,
    status = EXCLUDED.status,
    eligibility = EXCLUDED.eligibility,
    documents_status = EXCLUDED.documents_status,
    assessment_notes = EXCLUDED.assessment_notes,
    approved_amount = EXCLUDED.approved_amount,
    release_method = EXCLUDED.release_method,
    guarantee_letter_number = EXCLUDED.guarantee_letter_number,
    payout_date = EXCLUDED.payout_date,
    monitoring_logs = EXCLUDED.monitoring_logs;
