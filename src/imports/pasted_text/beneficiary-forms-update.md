# UPDATE ALL BENEFICIARY ONLINE SERVICE APPLICATION FORMS

IMPORTANT:

Do NOT redesign the MSWD Calabanga PMS.

Keep:

* Existing theme
* Existing navigation
* Existing beneficiary portal layout
* Existing Apply for Service dropdown
* Existing workflows
* Existing modules
* Existing database structure

Only update the online beneficiary application forms and service requirements.

Apply this update to ALL beneficiary online service applications.

---

# GLOBAL SERVICE APPLICATION WORKFLOW UPDATE

Before a beneficiary can apply for any service:

STEP 1:
CHECK BENEFICIARY PROFILE

System must verify if the logged-in beneficiary already has a registered Beneficiary Profile.

If NO profile exists:

Display:

"Beneficiary profile required before applying for services."

Redirect to:

Beneficiary Profile Registration

Create:

Individual / Family Profile

Required data:

* Profile Type
* Personal Information
* Family Members (if Family)
* Complete Address
* Supporting Documents

Status:

Pending Verification

---

If beneficiary profile already exists:

Allow:

Continue Service Application

Automatically populate:

* Client ID
* Name
* Birth Date
* Sex
* Civil Status
* Contact Number
* Address
* Profile Information

Beneficiary should NOT re-enter duplicate profile information.

---

# STANDARD APPLICATION FORM DESIGN

All service application forms must use the same layout.

Apply to:

Module 2:
Sectoral Social Welfare Services

Module 3:
Emergency and Crisis Assistance

Module 4:
Employment and Livelihood Programs

Module 5:
OFW / OWWA Support

Including all sub-modules.

---

# APPLICATION FORM STRUCTURE

## SECTION 1:

BENEFICIARY INFORMATION

Auto-display from Beneficiary Profile:

* Client ID
* Full Name
* Profile Type
* Birth Date
* Sex
* Civil Status
* Contact Number
* Address
* Beneficiary Priority Status

This section is READ ONLY.

---

## SECTION 2:

SERVICE INFORMATION

Display:

* Service Category
* Service Name
* Program Description

Example:

Category:

Emergency & Crisis Assistance

Service:

Medical Assistance

---

## SECTION 3:

SERVICE-SPECIFIC APPLICATION DETAILS

Each service must display its own required fields based on the MSWD Data Dictionary.

Do NOT use one generic form.

Each service must have its own:

* Input fields
* Dropdown options
* Requirements
* Supporting documents

---

# MODULE 2 SERVICE FORMS

## CICL Assistance

Fields:

* Case Number
* Referral Source
* Date Registered
* Program Service Type

  * Intervention Program
  * Diversion Program
  * Counseling
  * Rehabilitation
  * Others
* Start Date
* Expected End Date
* Priority Level
* Service Description
* Remarks

Requirements:

* Birth Certificate
* Valid ID
* Barangay Certificate
* Certificate of Indigency
* Others

---

## Day Care Services

Fields:

* Center Name
* Location Barangay
* Enrollment Date
* Age Group

Requirements:

* Birth Certificate
* Barangay Certificate

---

## Supplementary Feeding

Fields:

* Feeding Program Type
* Feeding Frequency
* Start Date
* Nutrition Assessment

Nutrition Status:

* Normal
* Underweight
* Severely Underweight
* Stunted
* Wasted

---

## Women and Solo Parent Assistance

Fields:

* Number of Children
* Employment Status
* Monthly Income
* Type of Assistance
* Program Category
* Assistance Amount

---

## PWD Services

Fields:

* Program/Service Type
* Disability Type
* Level of Support Needed
* Accessibility Requirements

Requirements:

* PWD ID
* Medical Certificate
* Disability Assessment Report
* Valid ID
* Barangay Certificate

---

## Elderly Services

Fields:

* Service Title
* Program Benefit

Benefits:

* Octogenarian Incentive
* Nonagenarian Incentive
* Golden Wedding Anniversary Incentive
* FSCAP Program
* BASCA Program

---

# MODULE 3 SERVICE FORMS

## Disaster Assistance

Fields:

* Disaster Type
* Date of Incident
* Location
* Number of Affected Houses
* Damage Assessment
* Assistance Category
* Immediate Needs
* Amount Requested

Requirements:

* Barangay Certification
* Photos of Damage
* Valid ID

---

## AICS

Fields:

Assistance Type:

* Medical
* Burial
* Transportation
* Economic Relief
* Balik Probinsya

Additional:

* Incident Date
* Reason Tags
* Description
* Amount Requested

Requirements depend on assistance type.

---

# MODULE 4 SERVICE FORMS

## Job Fair

Fields:

* Event Selection
* Participant Information
* Industry Category

## TUPAD

Fields:

* Project Type
* Position/Task
* Project Description
* Work Location
* Skills

Requirements:

* Barangay Certification
* Valid ID
* Employment History
* SSS/PhilHealth/Pag-IBIG
* Bank Account Details
* Medical Certificate

## DOLE Livelihood

Fields:

* Business Name
* Business Type
* Business Description
* Grant Purpose
* Requested Amount
* Proposed Use of Funds

Requirements:

* Business Proposal
* Valid ID
* Business Permit
* Business Photos

## SRA

Fields:

* Program Selection
* Skill Category
* Training Schedule
* Requirements

---

# MODULE 5 SERVICE FORMS

## OFW Profiling

Fields:

* Worker Type
* Country Deployment
* Occupation
* Recruitment Agency
* OWWA Membership Status
* Emergency Contact

---

## OWWA Officer Organization

Fields:

* Role/Position
* Specialty
* Assigned Region
* Assigned Province
* Assigned City
* Employment Status

---

# DOCUMENT UPLOAD STANDARD

All service applications must use the same upload component.

Display:

* Document Name
* Document Category
* File Type
* Upload Status

Allowed formats:

PDF
JPG
PNG
DOC

---

# APPLICATION STATUS

All submitted applications use:

* Pending Verification
* Approved
* For Revision
* Rejected

Service processing status may include:

* Draft
* Processing
* Reviewing Docs
* Action Required
* Scheduled
* Completed

---

# PRIORITY HANDLING

Add to all service forms:

Priority Level:

* Normal
* Priority
* Urgent

Priority Reason:

Text field

Rules:

Online beneficiaries default to:

Normal

Only MSWD staff can change:

Normal → Priority → Urgent

---

# FINAL REQUIREMENT

All beneficiary online service forms must:

* Connect to the Beneficiary Profile
* Avoid duplicate personal information
* Use service-specific fields
* Use correct requirements
* Use consistent MSWD Calabanga form design
* Use the same buttons, cards, dropdowns, upload components, and status badges

Do not create generic forms.

Every service must follow its own data dictionary.
