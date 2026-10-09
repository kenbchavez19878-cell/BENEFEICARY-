Create the Beneficiary Dashboard for the MSWD Calabanga Client Portal.

IMPORTANT ACCESS CONTROL RULES:

* This dashboard is ONLY accessible for users with the "Beneficiary" role.
* Do not allow Staff, Supervisor, or Administrator accounts to access this dashboard.

Role validation:

If logged-in user role is NOT Beneficiary, display an Access Denied page:

Title:
"Access Denied"

Message:
"This dashboard is only available for verified beneficiaries."

Button:
"Return to Login"

---

BENEFICIARY ACCOUNT VERIFICATION

Before showing the dashboard, verify:

1. User has an existing registered account.
2. User registration has been submitted.
3. Residency verification has been completed.
4. Account approval status has been approved by MSWD.

If the user has no registered account:

Display:

"Account Not Found"

Message:
"You need to create a beneficiary account before accessing MSWD services."

Buttons:

* Register Account
* Contact MSWD Office

If registration is pending:

Display:

"Account Verification Pending"

Message:
"Your registration is currently under review by MSWD Calabanga. Please wait for account approval."

Show:

* Submitted Date
* Verification Status
* Uploaded Documents Status

---

DESIGN SYSTEM REQUIREMENT

The Beneficiary Dashboard MUST use the same design style as:

* MSWD Calabanga Public Portal
* Beneficiary Registration Page
* MSWD Login Page

Do not create a different theme.

Reuse:

* Same typography
* Same color palette
* Same buttons
* Same cards
* Same border radius
* Same spacing
* Same icons
* Same responsive behavior

Theme:

Primary Color:
Government Blue

Secondary Color:
MSWD Green

Background:
Clean White

Style:
Modern LGU Government Service Portal
Professional
Accessible
Trustworthy

---

BENEFICIARY DASHBOARD NAVBAR

Create a fixed responsive navigation bar.

LEFT SIDE:

MSWD Logo

Use:
Official Municipal/MSWD Calabanga logo placeholder

Brand Name:

"MSWD Calabanga Client Portal"

NAVIGATION MENU:

1. MY DASHBOARD

Link to beneficiary homepage.

Display:

Welcome Card:

"Welcome back, [Resident Name]"

Show beneficiary information:

* Full Name
* Barangay
* Account Status
* Verification Status

Dashboard Summary Cards:

* Active Applications
* Pending Requests
* Approved Services
* Notifications

---

2. APPLY FOR SERVICE ▼

Create a dropdown mega menu for MSWD service applications.

MODULE 2:
SECTORAL SOCIAL WELFARE SERVICES

Services:

Children and Youth Services:

* CICL Assistance
* Day Care Services
* Supplementary Feeding Program

Women and Solo Parent Assistance

Differently Abled Persons (PWD) Services

Elderly Services

MODULE 3:
EMERGENCY AND CRISIS ASSISTANCE

Services:

Disaster Assistance:

* Relief Assistance
* Emergency Shelter Assistance (ESA)

Assistance to Individuals in Crisis Situation (AICS):

* Medical Assistance
* Burial Assistance
* Transportation Assistance
* Relief Assistance
* Balik Probinsya Assistance

MODULE 4:
LIVELIHOOD AND EMPLOYMENT

Services:

* Job Fair Management
* TUPAD Program
* DOLE Livelihood Assistance
* Special Recruitment Activity (SRA)

MODULE 5:
OFW AND OWWA SUPPORT

Services:

* OFW Profiling
* OWWA Officer Organization

Each service item should open a service application page containing:

* Service description
* Eligibility requirements
* Required documents
* Application form
* Submit application button

---

3. MY TRANSACTIONS

Create a transaction monitoring page.

Purpose:

Allow beneficiaries to track all submitted applications.

Display:

Application Cards:

* Application Number
* Service Name
* Date Submitted
* Current Status

Status Indicators:

Pending
Under Review
Approved
Rejected
Completed

Actions:

* View Details
* View Requirements
* Download Documents

---

4. MY DOCUMENTS

Create a digital document wallet.

Display uploaded beneficiary documents:

Required Documents:

* Government ID
* Barangay Certificate of Residency
* Barangay Certificate of Indigency
* Supporting Documents

Features:

* Upload Document
* Preview File
* Document Verification Status

Document Status:

Verified
Pending Review
Rejected

---

RIGHT SIDE USER MENU

Display:

👤 [Resident Name] ▼

Dropdown:

⚙ Account Settings

Include:

* Edit Profile
* Update Contact Information
* Change Password
* Notification Settings

🚪 Logout

Add confirmation modal:

"Are you sure you want to logout?"

Buttons:

Cancel
Logout

---

MAIN DASHBOARD CONTENT

Create sections:

1. Profile Overview Card

Display:

* Resident Photo Placeholder
* Full Name
* Barangay
* Mobile Number
* Verification Status

2. Available Services

Create four service category cards:

Sectoral Services

Emergency & Crisis Assistance

Livelihood & Employment

OFW & OWWA Support

Each card:

* Icon
* Short description
* View Services button

3. Notifications

Display:

* Application updates
* MSWD announcements
* Verification notices

---

RESPONSIVE REQUIREMENTS

Desktop:

* Full navbar
* Dropdown menus
* Dashboard cards
* Sidebar-style content layout

Tablet:

* Collapsible navigation

Mobile:

* Hamburger menu
* Mobile dropdown
* Stacked cards
* Touch-friendly buttons

---

GENERATE THESE PAGES:

1. Beneficiary Dashboard Homepage
2. Apply for Service Dropdown Interface
3. Service Category Pages
4. My Transactions Page
5. My Documents Page
6. Account Settings Page
7. Access Denied Page
8. Account Verification Pending Page

The final output must look like a single unified MSWD Calabanga Client Portal system and must visually match the existing Registration and Login pages.
