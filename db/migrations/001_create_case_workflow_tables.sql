-- Migration: 001_create_case_workflow_tables.sql
-- Description: Create enums and tables for Women & Solo Parent and AICS case workflows in BenefitTrack

-- 1. Create Enums if they do not exist
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'case_status_enum') THEN
        CREATE TYPE case_status_enum AS ENUM (
            'BARANGAY_ENDORSED',
            'UNDER_REVIEW',
            'RETURNED_FOR_CORRECTION',
            'IN_ASSESSMENT',
            'ELIGIBILITY_EVALUATED',
            'APPROVED_FOR_RELEASE',
            'RELEASED_COMPLETED',
            'CASE_CLOSED'
        );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'eligibility_status_enum') THEN
        CREATE TYPE eligibility_status_enum AS ENUM (
            'ELIGIBLE',
            'NOT_ELIGIBLE',
            'ADDITIONAL_REQUIREMENTS',
            'FOR_REFERRAL'
        );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'aics_type_enum') THEN
        CREATE TYPE aics_type_enum AS ENUM (
            'MEDICAL',
            'BURIAL',
            'TRANSPORTATION',
            'ECONOMIC_RELIEF',
            'BALIK_PROBINSYA'
        );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'release_method_enum') THEN
        CREATE TYPE release_method_enum AS ENUM (
            'CASH',
            'CHECK',
            'GUARANTEE_LETTER'
        );
    END IF;
END $$;

-- 2. Trigger function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Table 1: women_and_solo_parent_cases
CREATE TABLE IF NOT EXISTS women_and_solo_parent_cases (
    id SERIAL PRIMARY KEY,
    case_number VARCHAR(50) UNIQUE NOT NULL,
    beneficiary_name VARCHAR(255) NOT NULL,
    barangay_name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('SOLO_PARENT', 'WOMEN_VAWC')),
    status case_status_enum DEFAULT 'BARANGAY_ENDORSED',
    eligibility eligibility_status_enum,
    documents_status JSONB DEFAULT '{}'::jsonb,
    assessment_notes TEXT,
    vulnerability_level VARCHAR(20) CHECK (vulnerability_level IN ('HIGH', 'MODERATE', 'LOW') OR vulnerability_level IS NULL),
    spic_number VARCHAR(50),
    booklet_number VARCHAR(50),
    financial_aid_amount NUMERIC(10, 2),
    referrals JSONB DEFAULT '[]'::jsonb,
    release_method release_method_enum,
    payout_date DATE,
    monitoring_logs JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

DROP TRIGGER IF EXISTS trg_women_cases_update_timestamp ON women_and_solo_parent_cases;
CREATE TRIGGER trg_women_cases_update_timestamp
    BEFORE UPDATE ON women_and_solo_parent_cases
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp_column();

-- Indexes for fast searches and filtering
CREATE INDEX IF NOT EXISTS idx_women_cases_status ON women_and_solo_parent_cases(status);
CREATE INDEX IF NOT EXISTS idx_women_cases_category ON women_and_solo_parent_cases(category);
CREATE INDEX IF NOT EXISTS idx_women_cases_barangay ON women_and_solo_parent_cases(barangay_name);
CREATE INDEX IF NOT EXISTS idx_women_cases_beneficiary ON women_and_solo_parent_cases(beneficiary_name);

-- 4. Table 2: aics_cases
CREATE TABLE IF NOT EXISTS aics_cases (
    id SERIAL PRIMARY KEY,
    case_number VARCHAR(50) UNIQUE NOT NULL,
    beneficiary_name VARCHAR(255) NOT NULL,
    barangay_name VARCHAR(100) NOT NULL,
    aics_type aics_type_enum NOT NULL,
    status case_status_enum DEFAULT 'BARANGAY_ENDORSED',
    eligibility eligibility_status_enum,
    documents_status JSONB DEFAULT '{}'::jsonb,
    assessment_notes TEXT,
    approved_amount NUMERIC(10, 2),
    release_method release_method_enum,
    guarantee_letter_number VARCHAR(100),
    payout_date DATE,
    monitoring_logs JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

DROP TRIGGER IF EXISTS trg_aics_cases_update_timestamp ON aics_cases;
CREATE TRIGGER trg_aics_cases_update_timestamp
    BEFORE UPDATE ON aics_cases
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp_column();

-- 5. Additional intake profile columns
ALTER TABLE women_and_solo_parent_cases 
  ADD COLUMN IF NOT EXISTS contact_number VARCHAR(50),
  ADD COLUMN IF NOT EXISTS civil_status VARCHAR(50),
  ADD COLUMN IF NOT EXISTS birth_date DATE,
  ADD COLUMN IF NOT EXISTS gender VARCHAR(20),
  ADD COLUMN IF NOT EXISTS indigency_level VARCHAR(50),
  ADD COLUMN IF NOT EXISTS dependent_children INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS solo_parent_reason VARCHAR(100);

ALTER TABLE aics_cases 
  ADD COLUMN IF NOT EXISTS contact_number VARCHAR(50),
  ADD COLUMN IF NOT EXISTS civil_status VARCHAR(50),
  ADD COLUMN IF NOT EXISTS birth_date DATE,
  ADD COLUMN IF NOT EXISTS income_status VARCHAR(50),
  ADD COLUMN IF NOT EXISTS service_provider VARCHAR(255),
  ADD COLUMN IF NOT EXISTS crisis_summary TEXT;

