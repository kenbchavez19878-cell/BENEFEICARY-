TASK: COMPLETE PMS SYSTEM-WIDE MODULE, WORKFLOW, ROLE, AND DASHBOARD UPDATE

IMPORTANT:

The existing PMS (Program Management System) already has dashboards, modules, themes, and layouts.

DO NOT redesign the entire system.

KEEP:

* Existing PMS design system
* Government Blue primary color
* MSWD Green secondary color
* Existing typography
* Existing sidebar style
* Existing cards
* Existing tables
* Existing buttons
* Existing responsive behavior

ONLY UPDATE:

* System modules
* Workflow logic
* Role permissions
* Dashboard content
* Application process
* Beneficiary profiling integration
* Program processing flow

---

NEW SYSTEM STRUCTURE

The PMS must follow this operational workflow:

BENEFICIARY MASTER PROFILE

↓

SERVICE APPLICATION

↓

BARANGAY VERIFICATION / ENDORSEMENT

↓

MSWD PROCESSING

↓

DISBURSEMENT / SERVICE DELIVERY

↓

REPORTING AND MONITORING

---

MASTER MODULE UPDATE

CREATE:

MODULE 1:
BENEFICIARY PROFILING AND RECORDS

IMPORTANT:

Every beneficiary must complete profiling before applying to any program.

The Beneficiary Profile becomes the central database connected to all modules.

Profile Types:

1. INDIVIDUAL BENEFICIARY

Fields:

Beneficiary ID
(System-generated)

Full Legal Name

Date of Birth

Age
(Auto-calculated)

Place of Birth

Sex at Birth

Civil Status

Nationality
(Default Filipino)

Religion

Highest Educational Attainment

Contact Number

Barangay
(48 Calabanga Barangays)

Purok / Zone

Street Address

Employment Status

Monthly Personal Income

4Ps Beneficiary Status

4Ps Household ID Number

Indigenous Person Status

IP Tribe / Affiliation

---

2. FAMILY BENEFICIARY

Fields:

Family Registry ID
(System-generated)

Family Head Beneficiary ID

Full Legal Name

Date of Birth

Age

Place of Birth

Sex

Civil Status

Nationality

Religion

Education

Contact Number

Barangay

Purok

Address

Employment Status

Monthly Income

4Ps Status

IP Status

HOUSEHOLD MEMBERS:

Full Name

Relationship to Family Head

Date of Birth

Age

Sex

Education

Employment Status

Income

---

APPLICATION RULE

Before any service application:

System checks:

Does beneficiary profile exist?

YES:

Continue to service application.

NO:

Require beneficiary profiling first.

This applies to:

* Beneficiary Portal
* Barangay Secretary
* MSWD Staff

---

UPDATED MODULES

MODULE 1:
BENEFICIARY PROFILING AND RECORDS

MODULE 2:
SECTOR FRONTLINE CRISIS & EMERGENCY ASSISTANCE

Programs:

1. Assistance to Individuals in Crisis Situations (AICS Cash Grants)

2. Disaster Relief Operations
   (Evacuation Center Management)

MODULE 3:
SECTOR EARLY CHILDHOOD & YOUTH WELFARE SERVICES

Programs:

1. ECCD Day Care Centers

2. Supplemental Feeding Program

3. Child Protection Services

MODULE 4:
SECTORAL REGISTRIES & SPECIALIZED PROTECTIONS

Programs:

1. Senior Citizen Welfare & OSCA ID Registry

2. Persons with Disabilities (PWD) Desk & ID Registry

3. Solo Parent Support Program & ID Registry

MODULE 5:
DISBURSEMENT MANAGEMENT

Purpose:

Track financial releases and government assistance distribution.

---

APPLICATION ENTRY POINTS

The system supports three ways:

OPTION 1:

Beneficiary Online Application

Beneficiary logs in:

Create Profile

↓

Apply Program

↓

Track Application

---

OPTION 2:

Barangay Assisted Application

Barangay Secretary logs in:

Create Beneficiary Profile

OR

Search Existing Beneficiary

↓

Apply Program on behalf of beneficiary

↓

Verify Documents

↓

Endorse to MSWD

---

OPTION 3:

MSWD Assisted Application

MSWD Staff logs in:

Create Beneficiary Profile

OR

Search Existing Beneficiary

↓

Create Program Application

↓

Process Case

---

BENEFICIARY PORTAL UPDATE

Sidebar:

Dashboard

Beneficiary Profile

Apply for Service

My Applications

My Documents

Notifications

Account Settings

Functions:

Create Individual Profile

Create Family Profile

Update Profile

Apply Programs

Upload Requirements

Track Status

---

BARANGAY SECRETARY DASHBOARD UPDATE

Sidebar:

Dashboard

Beneficiary Profiling

Beneficiary Records

Program Applications

Verification Queue

Endorsements

Notifications

Account Settings

NEW BUTTONS:

CREATE BENEFICIARY PROFILE

Purpose:

For walk-in residents.

APPLY PROGRAM FOR BENEFICIARY

Programs:

AICS

Disaster Relief

ECCD

Supplemental Feeding

Child Protection

Senior Citizen Registry

PWD Registry

Solo Parent Registry

Workflow:

Create/Search Beneficiary

↓

Complete Profile

↓

Submit Application

↓

Verify Documents

↓

Endorse MSWD

Restrictions:

Cannot:

Approve MSWD cases

Process payment

Access reports

Manage users

---

MSWD STAFF DASHBOARD UPDATE

Sidebar:

Dashboard

Beneficiary Profiling

Beneficiary Records

Applications

Case Assessment

Programs & Services

Disbursement

Service Monitoring

Notifications

Account Settings

NEW BUTTONS:

CREATE BENEFICIARY PROFILE

For municipal walk-in applicants.

SEARCH BENEFICIARY

Check existing records.

CREATE APPLICATION

Programs:

AICS

Disaster Relief

ECCD

SFP

Child Protection

Senior Citizen

PWD

Solo Parent

Workflow:

Profile Verification

↓

Case Assessment

↓

Program Processing

↓

Approval

↓

Disbursement

Restrictions:

Cannot:

Manage users

View audit logs

Change permissions

---

MSWD HEAD DASHBOARD UPDATE

Purpose:

Program management and monitoring.

Sidebar:

Dashboard

Program Monitoring

Beneficiary Reports

Program Reports

Disbursement Reports

Analytics Dashboard

Notifications

Account Settings

View:

Total Beneficiaries

Applications

Approved Services

Completed Programs

Budget Released

Barangay Performance

Program Statistics

Cannot:

Create users

Manage roles

Access audit logs

---

ADMINISTRATOR DASHBOARD UPDATE

Purpose:

System administration only.

Sidebar:

Dashboard

User Management

Role Management

Audit Logs

System Settings

Notifications

Account Settings

Functions:

Create accounts

Assign roles

Manage permissions

Monitor system activities

---

DISBURSEMENT MODULE

Connected to:

AICS

Emergency Relief

Other Financial Assistance

Fields:

Disbursement ID

Beneficiary ID

Program

Approved Amount

Release Type

Release Date

Status

Statuses:

Pending

Approved

Released

Completed

---

FINAL SYSTEM WORKFLOW

Beneficiary:

Create Profile

↓

Apply Service

Barangay Secretary:

Verify Profile

↓

Validate Documents

↓

Endorse Application

MSWD Staff:

Assess Case

↓

Process Program

↓

Approve Service

↓

Prepare Disbursement

MSWD Head:

Monitor Programs

Administrator:

Manage System

---

FINAL REQUIREMENT

Update the entire PMS into a beneficiary-centered government social welfare system.

All programs must connect to:

Beneficiary Profiling Database

Family Registry

Application Records

Service History

Disbursement Records

No duplicate beneficiary records.

One Beneficiary ID must be used across all programs.
