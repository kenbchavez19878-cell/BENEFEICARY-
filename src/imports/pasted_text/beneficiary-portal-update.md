TASK: UPDATE BENEFICIARY PORTAL - APPLY FOR SERVICE MODULE

IMPORTANT:

The Beneficiary Portal already exists.

DO NOT redesign the existing UI.

Keep:

* Existing beneficiary dashboard design
* Government Blue primary color
* MSWD Green secondary color
* Existing navbar
* Existing cards
* Existing buttons
* Existing typography
* Existing responsive behavior

ONLY UPDATE:

* Apply for Service navigation
* Service categories
* Program list
* Eligibility requirements
* Application workflow
* Forms
* Beneficiary profile integration
* Document requirements

---

UPDATE BENEFICIARY NAVBAR

Current:

Apply for Service

Update into:

Apply for Service ▼

Dropdown Categories:

Sector 1:
Frontline Crisis & Emergency Assistance

Programs:

1. Assistance to Individuals in Crisis Situations (AICS Cash Grants)

2. Disaster Relief Operations (Evacuation Center Management)

Sector 3:
Early Childhood & Youth Welfare Services

Programs:

1. Early Childhood Care and Development (ECCD Day Care Centers)

2. Supplemental Feeding Program (SFP)

3. Child Protection Services (Abuse & Custody Cases)

Sector 4:
Sectoral Registries & Specialized Protections

Programs:

1. Senior Citizen Welfare & OSCA ID Registry

2. Persons with Disabilities (PWD) Desk & ID Registry

3. Solo Parent Support Program & ID Registry

---

IMPORTANT SYSTEM LOGIC

BEFORE APPLYING TO ANY PROGRAM:

The system MUST check the Beneficiary Profile.

STEP 1:

Check existing Beneficiary Information.

If profile exists:

Display beneficiary information.

If no profile exists:

Redirect to:

Create Beneficiary Profile

The beneficiary cannot continue without completing profiling.

---

BENEFICIARY PROFILE DISPLAY

Before every application form display:

"Beneficiary Information"

Profile Type Selection:

OPTION 1:

Individual Beneficiary

OPTION 2:

Family Beneficiary

---

INDIVIDUAL BENEFICIARY PROFILE

Display:

Beneficiary ID

(System Generated)

Full Legal Name

Last Name

First Name

Middle Name

Extension Name

Date of Birth

Age

(Auto calculated)

Place of Birth

Sex at Birth

Civil Status

Nationality / Citizenship

(Default Filipino)

Religion

Highest Educational Attainment

Contact Number

Barangay

(Calabanga 48 Barangays Dropdown)

Purok / Zone

Street Address / House Number

Employment Status

Monthly Personal Income

4Ps Beneficiary Status

4Ps Household ID Number

Indigenous Person Status

IP Tribe / Affiliation

---

FAMILY BENEFICIARY PROFILE

Display:

Family Registry ID

(System Generated)

Family Head Beneficiary ID

Full Legal Name

Date of Birth

Age

Place of Birth

Sex at Birth

Civil Status

Nationality

Religion

Education

Contact Number

Barangay

Purok / Zone

Street Address

Employment Status

Monthly Income

4Ps Status

4Ps Household ID

IP Status

IP Tribe

---

HOUSEHOLD MEMBERS

Display:

Full Name

Relationship to Family Head

Date of Birth

Age

Sex

Highest Educational Attainment

Employment Status

Monthly Income

---

AFTER PROFILE CONFIRMATION

Show:

"Continue Application"

The system creates:

Transaction ID

(System generated)

Beneficiary ID

(Automatically linked)

Application Date

Program Selected

Application Status

---

PROGRAM APPLICATION FORMS

==================================================

PROGRAM 1:

AICS CASH GRANTS

Eligibility:

Must have:

Existing Beneficiary Profile

Valid Government ID

Proof of Crisis Situation

Application Form:

Transaction ID

Auto Generated

Beneficiary ID

Auto Linked

Requested Assistance Type:

Medical

Burial

Educational

Emergency Transportation

Claimant Type:

Self

Representative

If Representative selected:

Representative Full Name

Relationship

Contact Number

Emergency Description

Document Upload:

Government ID

Crisis Proof:

Medical Abstract

Death Certificate

Enrollment Form

Other Crisis Documents

Submit Application

==================================================

PROGRAM 2:

DISASTER RELIEF OPERATIONS

Eligibility:

Must have:

Registered Beneficiary

Affected by declared disaster

Application Form:

Transaction ID

Master Beneficiary ID

Family Registry ID

Calamity Type:

Typhoon

Flooding

Fire

Other Disaster

Household Headcount

Vulnerability Checklist:

Infant/Lactating Mother

Senior Citizen

Person with Disability

Injured/Sick Member

Document Upload:

Proof of Identity

Submit Emergency Intake

==================================================

PROGRAM 3:

ECCD DAY CARE CENTERS

Eligibility:

Child age:

3-4 years old

Must belong to registered household.

Application Form:

Transaction ID

Parent/Guardian Beneficiary ID

Child Selector:

Display household members only

Age validation:

3-4 years old only

Day Care Center Selection:

Available Calabanga Day Care Centers

Documents:

Child PSA Birth Certificate

2x2 Child Photo

Immunization Card / Health Record

Submit Enrollment

==================================================

PROGRAM 4:

SUPPLEMENTAL FEEDING PROGRAM

Eligibility:

Child must:

Be enrolled in ECCD

Be identified underweight/severely underweight

Application Form:

Transaction ID

Child Profile Link

Assigned Day Care Center

Nutrition Status:

Underweight

Severely Underweight

Parent Consent:

"I consent to my child participating in the 120-day feeding program."

Digital Signature / Checkbox

Submit Consent

==================================================

PROGRAM 5:

CHILD PROTECTION SERVICES

Eligibility:

For:

Children under 18

Youth victims

CICL cases

Application Form:

Transaction ID

Complainant Beneficiary ID

Anonymous Reporting Option

Victim Selector:

Individual Minor

Family Household Child

Case Type:

Physical Abuse

Sexual Exploitation

Neglect / Abandonment

Child in Conflict with the Law

Incident Narrative

Evidence Upload:

Photos

Videos

Medical Documents

Police Documents

Submit Report

==================================================

PROGRAM 6:

SENIOR CITIZEN WELFARE & OSCA ID REGISTRY

Eligibility:

Age requirement:

60 years old and above

Application Form:

Transaction ID

Beneficiary ID

Application Type:

New Registration

Replacement ID

Documents:

Proof of Age

Birth Certificate / Passport

2x2 ID Picture

Affidavit of Loss

(Replacement only)

Submit Registration

==================================================

PROGRAM 7:

PWD DESK & ID REGISTRY

Eligibility:

Resident with verified disability condition.

Application Form:

Transaction ID

Beneficiary ID

Disability Type:

Deaf/Hard of Hearing

Intellectual Disability

Learning Disability

Mental Disability

Physical Disability

Psychosocial Disability

Speech Impairment

Visual Disability

Medical Condition

Disability Visibility:

Apparent

Non-Apparent

Documents:

2x2 Picture

Medical Certificate

Clinical Abstract

Whole Body Photo

Submit Application

==================================================

PROGRAM 8:

SOLO PARENT SUPPORT PROGRAM & ID REGISTRY

Eligibility:

Must meet Solo Parent qualification.

Application Form:

Transaction ID

Beneficiary ID

Solo Parent Category:

Death of Spouse

Unmarried Parent

Abandoned by Spouse

Spouse Incarcerated

Separated Parent

Spouse Disabled

Dependent Child Selector:

Select household children

Documents:

2x2 Picture

Proof of Solo Parent Status

Income Proof

Submit Registration

---

APPLICATION STATUS TRACKING

After submission display:

Pending Verification

Under Barangay Review

Endorsed to MSWD

Under Assessment

Approved

Rejected

Completed

---

FINAL WORKFLOW

Beneficiary:

Login

↓

View/Create Beneficiary Profile

↓

Select Apply for Service

↓

Choose Sector

↓

Choose Program

↓

Review Eligibility

↓

Display Beneficiary Information

↓

Complete Program Specific Form

↓

Upload Requirements

↓

Submit Application

↓

Track Status

---

FINAL REQUIREMENT:

Transform Apply for Service into a complete beneficiary-centered application portal.

All programs must use the same Beneficiary ID and connect to:

* Beneficiary Profile
* Family Registry
* Applications
* Documents
* Service History
* Disbursement Records
