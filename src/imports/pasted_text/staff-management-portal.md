Create a role-based Staff Management and Assignment System for the MSWD Calabanga Program Management System (PMS).

IMPORTANT:

Do not redesign the existing PMS design.

Keep the current:

* Theme
* Colors
* Layout
* Sidebar
* Navigation style
* Dashboard style
* Components

Only add staff account management and module assignment functionality.

Use the existing MSWD Calabanga PMS design system.

---

STAFF ACCOUNT SYSTEM

Create 8 staff accounts:

Staff 1
Staff 2
Staff 3
Staff 4
Staff 5
Staff 6
Staff 7
Staff 8

Each staff account should have:

* Staff ID
* Full Name
* Username
* Password
* Role: Staff
* Assigned Module
* Assigned Services
* Account Status

Account Status:

* Active
* Inactive

---

ROLE-BASED ACCESS CONTROL

When a Staff user logs in:

The system must check their assigned module and services.

Staff users should ONLY see:

* Main Dashboard
* Their assigned module dashboard
* Their assigned service dashboards
* Notifications
* Settings
* Profile
* Logout

Hide all unassigned modules.

Do not display unauthorized modules in:

* Sidebar
* Dashboard cards
* Dropdown menus
* Search results
* Quick actions

---

STAFF LOGIN EXAMPLES

Example:

STAFF 1 LOGIN

Assigned:

Module 1:
Beneficiary Profiling and Records

Service:
Individual & Family Profiling

After login, Staff 1 sees:

Main Dashboard

Module 1 Dashboard

Individual & Family Profiling Dashboard

Notifications

Settings

Logout

Staff 1 cannot access:

Module 2
Module 3
Module 4
Module 5
Module 6

Display:

"Access Restricted. You do not have permission to access this module."

---

STAFF ASSIGNMENT STRUCTURE

MODULE 1

Beneficiary Profiling and Records

Assigned Staff:

Staff 1

Service:

Individual & Family Profiling

---

MODULE 2

Sectoral Social Welfare Services

Staff Assignments:

Staff 2:

Children and Youth Services

Services:

* CICL Assistance
* Day Care Services

Staff 3:

Children and Youth Services

Services:

* Supplementary Feeding

Women and Solo Parent Assistance

Staff 4:

Services:

* Differently Abled Persons (PWD) Services
* Elderly Services

Each staff should only see their assigned services.

Example:

Staff 2 Dashboard:

Module:
Sectoral Social Welfare Services

Visible Services:

* CICL Assistance
* Day Care Services

Hidden:

* Supplementary Feeding
* Women and Solo Parent Assistance
* PWD Services
* Elderly Services

---

MODULE 3

Emergency and Crisis Assistance

Staff 5

Assigned Services:

Disaster Assistance

* Relief Assistance
* Emergency Shelter Assistance (ESA)

AICS:

* Medical Assistance
* Burial Assistance
* Transportation Assistance
* Economic Relief
* Balik Probinsya

Staff 5 sees only Module 3 Emergency Dashboard.

---

MODULE 4

Employment and Livelihood Programs

Staff 6:

Services:

* Job Fair Management
* TUPAD Program

Staff 7:

Services:

* DOLE Livelihood Assistance
* Special Recruitment Activity (SRA)

Each staff sees only their assigned livelihood services.

---

MODULE 5

OFW / OWWA Service

Staff 8:

Services:

* OFW Profiling
* OWWA Officer Organization

Staff 8 sees:

OFW / OWWA Dashboard

with only assigned services.

---

STAFF DASHBOARD STRUCTURE

Every staff dashboard should contain:

Header:

MSWD Calabanga Program Management System

Welcome:

"Welcome back, Staff Name"

Display:

* Assigned Module
* Assigned Services
* Pending Applications
* Recent Activities
* Notifications

SIDEBAR:

Always show:

* Main Dashboard
* Notifications
* Settings
* Profile
* Logout

Only show assigned modules/services.

---

NOTIFICATION SYSTEM

Create staff-specific notifications:

Examples:

"New CICL application submitted"

"New TUPAD beneficiary registered"

"Medical Assistance request pending review"

Notifications should only appear for assigned services.

---

SETTINGS

Available for all staff:

* Edit Profile
* Change Password
* Notification Preferences

---

LOGOUT

Create logout confirmation:

"Are you sure you want to logout?"

Buttons:

Cancel

Logout

---

ACCESS DENIED PAGE

If staff tries accessing another module:

Display:

Access Restricted

"You are not assigned to manage this module."

Button:

Return to Dashboard

---

DO NOT INCLUDE MODULE 6 YET

Leave:

Module 6:
Reports and System Administration

for future development.

---

FINAL REQUIREMENT

Create a complete role-based staff portal where:

* Staff accounts are created
* Staff are assigned specific modules/services
* Staff only see authorized dashboards
* Unauthorized modules are hidden
* All staff share the same MSWD Calabanga PMS design
* Main Dashboard, Notifications, Settings, and Logout remain available for all staff
* Module 6 remains unavailable for now
