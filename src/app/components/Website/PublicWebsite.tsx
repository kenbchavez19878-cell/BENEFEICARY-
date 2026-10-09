import React, { useState, useRef, useEffect } from "react";
import {
  Heart, Users, Phone, Mail, MapPin, Clock,
  ChevronDown, ChevronRight, Menu, X, Search,
  ArrowRight, Shield, Briefcase, Globe, Baby,
  UserCheck, AlertCircle, Stethoscope,
  Calendar, FileText, Check, Award, Plane,
  HardHat, Zap, Wheat, Download,
  Home as HomeIcon, Bell, Star, Facebook, Youtube
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────

type PageId = "home" | "about" | "services" | "category" | "service-detail";

interface NavState {
  page: PageId;
  category?: string;
  service?: string;
}

interface ServiceInfo {
  id: string;
  title: string;
  category: string;
  description: string;
  icon: string;
}

interface CategoryInfo {
  id: string;
  title: string;
  description: string;
  icon: string;
  textColor: string;
  bgColor: string;
  borderColor: string;
  lightBg: string;
  services: ServiceInfo[];
}

interface ServiceDetail {
  overview: string;
  eligibility: string[];
  requirements: string[];
  process: string[];
  faq: { q: string; a: string }[];
}

// ─── Icon Registry ───────────────────────────────────────────

const IconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Heart, Shield, Baby, Wheat, UserCheck, Award, AlertCircle,
  HomeIcon, Stethoscope, Globe, ArrowRight, Briefcase,
  HardHat, Zap, Plane, FileText, Users, Bell,
  Download, Calendar, Check,
};

// ─── Static Data ─────────────────────────────────────────────

const STATS = [
  { label: "Barangays Served", value: "48" },
  { label: "Active Programs", value: "14+" },
  { label: "Beneficiaries (2024)", value: "12,400+" },
  { label: "Years of Service", value: "30+" },
];

const ANNOUNCEMENTS = [
  {
    id: 1, type: "announcement",
    title: "AICS Medical Assistance — Open for Applications",
    date: "July 8, 2025",
    excerpt: "The MSWD is now accepting applications for medical assistance under AICS. Eligible residents may visit the office Monday to Friday, 8:00 AM – 5:00 PM.",
  },
  {
    id: 2, type: "event",
    title: "TUPAD Program Enrollment for Q3 2025",
    date: "July 5, 2025",
    excerpt: "Target beneficiaries for TUPAD Q3 2025 are now being enrolled. Please bring required documents to the MSWD Office.",
  },
  {
    id: 3, type: "news",
    title: "Day Care Enrollment — SY 2025–2026",
    date: "July 1, 2025",
    excerpt: "Day care centers in all 48 barangays of Calabanga are now accepting enrollees for SY 2025–2026. Children ages 3–4 are eligible.",
  },
  {
    id: 4, type: "announcement",
    title: "PWD ID Renewal and New Applications",
    date: "June 28, 2025",
    excerpt: "PWD ID issuance and renewal is conducted every Tuesday and Thursday. Please bring a medical certificate and 1×1 ID photo.",
  },
];

const CATEGORIES: CategoryInfo[] = [
  {
    id: "crisis-emergency",
    title: "Frontline Crisis & Emergency Assistance",
    description: "Emergency assistance, crisis intervention, disaster response, and relief management",
    icon: "AlertCircle",
    textColor: "text-red-700",
    bgColor: "bg-red-700",
    borderColor: "border-red-700",
    lightBg: "bg-red-50",
    services: [
      { id: "aics-cash-grants", title: "Assistance to Individuals in Crisis Situations (AICS Cash Grants)", category: "Crisis Assistance", description: "Immediate financial assistance to individuals and families facing crisis situations", icon: "Zap" },
      { id: "disaster-relief-ops", title: "Disaster Relief Operations (Evacuation Center Management)", category: "Disaster Response", description: "Coordinated disaster relief, evacuation center management, and affected family assistance", icon: "Shield" },
    ],
  },
  {
    id: "early-childhood-youth",
    title: "Early Childhood & Youth Welfare Services",
    description: "Child welfare, early childhood development, nutrition support, and child protection services",
    icon: "Baby",
    textColor: "text-blue-700",
    bgColor: "bg-blue-700",
    borderColor: "border-blue-700",
    lightBg: "bg-blue-50",
    services: [
      { id: "eccd-day-care", title: "Early Childhood Care and Development (ECCD Day Care Centers)", category: "Early Childhood", description: "Comprehensive early childhood care and development services in 48 barangay day care centers", icon: "Baby" },
      { id: "sfp", title: "Supplemental Feeding Program (SFP)", category: "Nutrition", description: "Nutritional supplementation and feeding support for children with malnutrition", icon: "Wheat" },
      { id: "child-protection", title: "Child Protection Services (Abuse & Custody Cases)", category: "Child Protection", description: "Social welfare intervention for abused, neglected, and exploited children and custody cases", icon: "Shield" },
    ],
  },
  {
    id: "sectoral-registries",
    title: "Sectoral Registries & Specialized Protections",
    description: "Government registries, sectoral ID programs, and specialized welfare protections",
    icon: "UserCheck",
    textColor: "text-green-700",
    bgColor: "bg-green-700",
    borderColor: "border-green-700",
    lightBg: "bg-green-50",
    services: [
      { id: "senior-citizen-osca", title: "Senior Citizen Welfare & OSCA ID Registry", category: "Senior Citizens", description: "OSCA ID issuance, social pension, and welfare programs for residents 60 years and above", icon: "Award" },
      { id: "pwd-registry", title: "Persons with Disabilities (PWD) Desk & ID Registry", category: "Persons with Disabilities", description: "PWD ID issuance, disability registration, social pension, and specialized support programs", icon: "UserCheck" },
      { id: "solo-parent-registry", title: "Solo Parent Support Program & ID Registry", category: "Solo Parents", description: "Solo Parent ID issuance and comprehensive support program benefits under RA 8972", icon: "Heart" },
    ],
  },
];

const CATEGORY_MAP: Record<string, CategoryInfo> = Object.fromEntries(
  CATEGORIES.map(c => [c.id, c])
);

const SERVICE_MAP: Record<string, ServiceInfo & { categoryId: string }> = {};
CATEGORIES.forEach(cat => {
  cat.services.forEach(svc => {
    SERVICE_MAP[svc.id] = { ...svc, categoryId: cat.id };
  });
});

const SERVICE_DETAILS: Record<string, ServiceDetail> = {
  cicl: {
    overview: "The Children in Conflict with the Law (CICL) Assistance program provides comprehensive legal, psychological, and social welfare support to minors who have come in contact with the juvenile justice system. MSWD Calabanga implements diversion programs, court assistance, and aftercare services to rehabilitate and reintegrate children into their families and communities in accordance with RA 9344 (Juvenile Justice and Welfare Act).",
    eligibility: [
      "Children 15 years old and below (exempt from criminal liability)",
      "Children 15–18 years old who acted without discernment",
      "Children referred by barangay, police, or courts",
      "Residents of Calabanga, Camarines Sur",
    ],
    requirements: [
      "Birth certificate of the child (PSA-authenticated)",
      "Valid ID of parent or guardian",
      "Barangay clearance or certification",
      "Police or barangay referral (if applicable)",
    ],
    process: [
      "Walk-in or referral to MSWD Office",
      "Initial interview and assessment by social worker",
      "Case conference and intervention plan preparation",
      "Referral to appropriate agencies (courts, DSWD, NGOs)",
      "Diversion program or court proceedings as needed",
      "Aftercare monitoring and reintegration support",
    ],
    faq: [
      { q: "Is the process confidential?", a: "Yes. All CICL case information is strictly confidential under RA 9344 (Juvenile Justice and Welfare Act)." },
      { q: "Must parents be present?", a: "Yes. Parents or legal guardians must accompany the child during all proceedings and interventions." },
      { q: "What is a diversion program?", a: "Diversion is an alternative to court proceedings that focuses on rehabilitation and community reintegration for the child." },
    ],
  },
  "day-care": {
    overview: "The Day Care Services program provides early childhood care and development (ECCD) services for children ages 3–4 in all 48 barangays of Calabanga. Day Care Workers implement structured learning, health monitoring, and nutritional support to prepare children for formal schooling and support their holistic development.",
    eligibility: [
      "Children ages 3–4 years old",
      "Residents of Calabanga, Camarines Sur",
      "Children who have not yet attended formal schooling",
      "Priority for children from indigent families",
    ],
    requirements: [
      "PSA Birth Certificate of the child",
      "Barangay clearance or residency certification",
      "Child's health card or immunization record",
      "Recent 2×2 ID photo of the child",
    ],
    process: [
      "Visit the day care center in your barangay",
      "Submit enrollment documents",
      "Health assessment by the day care worker",
      "Parent/guardian orientation",
      "Enrollment confirmation and schedule assignment",
    ],
    faq: [
      { q: "How long are the sessions?", a: "Sessions run 2.5–3 hours daily, Monday to Friday." },
      { q: "Is there an enrollment fee?", a: "No. Day care services are completely free for all eligible children in Calabanga." },
      { q: "Do all 48 barangays have a center?", a: "Yes. Every barangay in Calabanga has a dedicated day care center staffed by a trained Day Care Worker." },
    ],
  },
  "supplementary-feeding": {
    overview: "The Supplementary Feeding Program (SFP) addresses malnutrition among children enrolled in day care centers. DSWD-prescribed nutritious meals are provided to malnourished and at-risk children for 120 feeding days per year to improve their nutritional status, health, and cognitive development.",
    eligibility: [
      "Enrolled day care children identified as malnourished or at-risk",
      "Children with mild to severe underweight or wasting",
      "Ages 3–5 years old in accredited day care centers",
    ],
    requirements: [
      "Enrollment in the local day care center",
      "Nutrition assessment results from the day care worker",
      "Parent/guardian consent form",
    ],
    process: [
      "Nutrition assessment (weighing and height measurement) by the day care worker",
      "Identification and registration of malnourished beneficiaries",
      "Daily provision of nutritious meals during day care sessions",
      "Monthly monitoring and reassessment of nutritional status",
    ],
    faq: [
      { q: "What food is provided?", a: "Meals follow DSWD-prescribed menus, typically consisting of rice, protein sources, and vegetables." },
      { q: "How long does the program run?", a: "The supplementary feeding program runs for 120 feeding days per year." },
    ],
  },
  "women-solo-parent": {
    overview: "The Women and Solo Parent Assistance program provides comprehensive support services to solo parents and women in difficult circumstances, as mandated by RA 8972 (Solo Parents' Welfare Act). Benefits include Solo Parent ID issuance, livelihood assistance, educational support for children, health referrals, and psychosocial interventions.",
    eligibility: [
      "Solo parents as defined under RA 8972 (unmarried, separated, widowed, etc.)",
      "Women victims of violence or exploitation",
      "Residents of Calabanga, Camarines Sur",
    ],
    requirements: [
      "Birth certificates of dependent children",
      "Valid government-issued ID",
      "Proof of solo parenthood (death certificate, court order, etc.)",
      "Barangay certification of residency",
      "Proof of income (for needs assessment)",
    ],
    process: [
      "Visit MSWD Office and request the Solo Parent application form",
      "Submit complete documentary requirements",
      "Interview and social case study by MSWD social worker",
      "ID issuance within 5–7 working days",
      "Enrollment in available programs and services",
    ],
    faq: [
      { q: "What benefits come with the Solo Parent ID?", a: "Benefits include flexible work schedules, parental leave, health programs, educational benefits for children, and livelihood assistance." },
      { q: "Does the ID expire?", a: "Yes. The Solo Parent ID is valid for one year and must be renewed annually at the MSWD Office." },
    ],
  },
  "pwd-services": {
    overview: "The PWD Services program provides social protection for Persons with Disabilities in Calabanga under RA 7277 (Magna Carta for Disabled Persons). Services include PWD ID issuance, social pension for indigent PWDs, skills training, livelihood assistance, and referral to partner agencies.",
    eligibility: [
      "Persons with physical, sensory, intellectual, or psychosocial disabilities",
      "Residents of Calabanga, Camarines Sur",
      "Must present a medical certificate or clinical diagnosis from a licensed physician",
    ],
    requirements: [
      "Accomplished PWD ID application form",
      "Medical certificate or clinical abstract",
      "Recent 1×1 ID photo (white background)",
      "PSA Birth Certificate",
      "Barangay certification of residency",
    ],
    process: [
      "Secure application form from MSWD or barangay hall",
      "Complete and submit documentary requirements",
      "Assessment by MSWD staff",
      "Issuance of PWD ID within 3–5 working days",
      "Enrollment in available programs and referrals to partner agencies",
    ],
    faq: [
      { q: "Is the PWD ID free?", a: "Yes. PWD IDs are issued free of charge to all qualified applicants." },
      { q: "What discounts does the PWD ID provide?", a: "PWDs are entitled to a 20% discount on goods, services, medicines, transportation, and recreation establishments." },
    ],
  },
  "elderly-services": {
    overview: "The Elderly Services program provides social protection and support for senior citizens (60 years and above) in Calabanga. Programs include the Social Pension for Indigent Senior Citizens (₱500/month), Supplemental Social Pension, livelihood assistance, and health and recreational activities.",
    eligibility: [
      "Residents 60 years old and above",
      "Social Pension: Indigent senior citizens with no regular income or pension",
      "Must not be receiving any other government pension or retirement benefit",
    ],
    requirements: [
      "PSA Birth Certificate or baptismal certificate",
      "Valid Senior Citizen ID",
      "Certificate of indigency from barangay",
      "Recent 1×1 ID photo",
    ],
    process: [
      "Visit MSWD Office or barangay hall",
      "Submit complete requirements",
      "Assessment and validation by MSWD staff",
      "Enrollment in the Social Pension list",
      "Quarterly pension release (for approved beneficiaries)",
    ],
    faq: [
      { q: "How much is the Social Pension?", a: "₱500 per month (₱1,500 per quarter) for qualified indigent senior citizens with no other pension." },
      { q: "When is the pension released?", a: "Quarterly releases: typically in March, June, September, and December of each year." },
    ],
  },
  "disaster-relief": {
    overview: "The Disaster Relief Assistance program provides immediate assistance to families in Calabanga affected by natural or man-made disasters. Relief assistance includes food packs, non-food items, and financial assistance to help families meet basic needs during and after calamities.",
    eligibility: [
      "Families in Calabanga directly affected by declared disasters or calamities",
      "Must be registered in the DSWD-DROMIC list of affected families",
      "Priority for the most vulnerable: indigent, elderly, PWD, pregnant women, and children",
    ],
    requirements: [
      "Valid ID of the family head",
      "Proof of disaster damage (MSWD/BDRRMC assessment)",
      "Barangay certification of being an affected resident",
    ],
    process: [
      "Report damage to barangay DRRM officer or MSWD",
      "Damage assessment by MSWD and BDRRMC teams",
      "Registration in the list of affected families",
      "Distribution of relief goods or financial assistance",
    ],
    faq: [
      { q: "How fast is relief distributed after a disaster?", a: "Relief operations typically begin within 24–72 hours after a disaster, subject to safety and accessibility conditions." },
      { q: "What is included in a food pack?", a: "Standard family food packs include rice, canned goods, instant noodles, and other basic food items." },
    ],
  },
  esa: {
    overview: "The Emergency Shelter Assistance (ESA) program provides financial assistance to families whose homes were damaged or destroyed by disasters, helping them repair or rebuild their shelters to restore safety and dignity.",
    eligibility: [
      "Families with partially or totally damaged houses due to disaster",
      "Residents of Calabanga, Camarines Sur",
      "Must be assessed and certified by the MSWD damage assessment team",
    ],
    requirements: [
      "Accomplished ESA application form",
      "Damage assessment report (MSWD or BDRRMC)",
      "Proof of homeownership or occupancy",
      "Valid ID of the applicant",
      "Photos of the damaged structure",
    ],
    process: [
      "Report damage to barangay or MSWD office",
      "On-site damage assessment by MSWD staff",
      "Submission of required documents",
      "Validation and endorsement by MSWD Head",
      "Release of ESA check or cash assistance",
    ],
    faq: [
      { q: "How much is the ESA grant?", a: "ESA ranges from ₱3,000 to ₱10,000 depending on the extent of damage (partial or total destruction)." },
      { q: "Can renters avail of ESA?", a: "ESA is primarily for homeowners, but renters or occupants may be considered on a case-by-case basis." },
    ],
  },
  "aics-medical": {
    overview: "The AICS Medical Assistance program provides financial help to indigent individuals and families facing hospitalization, surgeries, and medicine expenses. This program bridges the gap between PhilHealth coverage and actual medical costs for those who cannot afford treatment.",
    eligibility: [
      "Indigent individuals and families in Calabanga",
      "Patients currently confined or undergoing treatment",
      "Ambulatory patients with significant medical expenses",
      "Must not be a regular employee with full HMO coverage",
    ],
    requirements: [
      "Medical certificate or hospital abstract",
      "Hospital billing statement or prescription",
      "Valid ID of the patient or representative",
      "Barangay certificate of indigency",
      "PhilHealth card (if available)",
    ],
    process: [
      "Visit MSWD Office with complete documents",
      "Interview and social case study by social worker",
      "Assessment of financial need and medical situation",
      "Processing and endorsement by MSWD Head",
      "Issuance of financial assistance or referral letter",
    ],
    faq: [
      { q: "How much assistance can I receive?", a: "Assistance varies based on the case and available funds, typically ranging from ₱500 to ₱5,000." },
      { q: "Can a family member apply on my behalf?", a: "Yes, with a written authorization letter from the patient." },
    ],
  },
  "aics-burial": {
    overview: "The AICS Burial Assistance program provides financial support to indigent families who cannot afford funeral and burial expenses, ensuring that every deceased community member receives a dignified farewell regardless of their family's financial circumstances.",
    eligibility: [
      "Indigent families of deceased residents of Calabanga",
      "Families unable to pay for funeral or burial costs",
      "Must apply within 30 days from the date of death",
    ],
    requirements: [
      "Death certificate (PSA or local civil registry)",
      "Funeral receipts or billing statement",
      "Valid ID of the applicant",
      "Barangay certificate of indigency",
      "Proof of relationship to the deceased",
    ],
    process: [
      "Visit MSWD Office as soon as possible after the death",
      "Submit required documents",
      "Social case study and interview by social worker",
      "Validation and approval by MSWD Head",
      "Release of burial assistance",
    ],
    faq: [
      { q: "How much is the burial assistance?", a: "Burial assistance typically ranges from ₱3,000 to ₱5,000 depending on available funds." },
      { q: "Does it cover cremation?", a: "Yes. Both traditional burial and cremation expenses are covered." },
    ],
  },
  "aics-transport": {
    overview: "The AICS Transportation Assistance program provides fare allowance to indigent patients who need to travel from Calabanga to hospitals in Naga City or other areas for medical treatment, follow-up check-ups, or medical procedures not available locally.",
    eligibility: [
      "Indigent patients needing to travel for medical treatment",
      "Patients referred to hospitals outside Calabanga",
      "Patients requiring regular medical follow-up treatment",
    ],
    requirements: [
      "Medical referral slip from local health center or physician",
      "Valid ID of the patient or representative",
      "Barangay certificate of indigency",
    ],
    process: [
      "Secure medical referral from local health center",
      "Visit MSWD Office with required documents",
      "Interview and assessment by MSWD staff",
      "Issuance of transportation assistance",
    ],
    faq: [
      { q: "How much is the transportation allowance?", a: "Transportation assistance ranges from ₱200 to ₱1,000 per trip depending on destination and medical need." },
      { q: "Can I apply multiple times?", a: "Yes, for patients requiring repeated treatment trips, multiple applications may be submitted subject to available funds." },
    ],
  },
  "balik-probinsya": {
    overview: "The Balik Probinsya Assistance program helps Calabanga residents who are stranded or displaced in Metro Manila or other areas due to job loss, emergencies, or other compelling reasons to return home safely to their families and communities.",
    eligibility: [
      "Calabanga residents stranded or displaced outside the municipality",
      "Individuals with no means to pay for return transportation",
      "Families returning due to displacement, job loss, or family emergencies",
    ],
    requirements: [
      "Valid ID or proof of being a Calabanga resident",
      "Barangay certification from Calabanga barangay of origin",
      "Proof of displacement or stranded status",
    ],
    process: [
      "Contact MSWD Calabanga or the nearest DSWD Field Office",
      "Initial assessment of the situation",
      "Coordination with transport providers",
      "Provision of transportation and travel assistance",
      "Monitoring upon arrival and referral to local support services",
    ],
    faq: [
      { q: "Does this cover entire families?", a: "Yes. The program covers both individuals and complete family units in need of return transportation." },
      { q: "How do I contact MSWD if I am stranded?", a: "Call (054) 871-1234 or message the MSWD Calabanga Facebook page for immediate assistance." },
    ],
  },
  "job-fair": {
    overview: "The Job Fair Management program organizes regular employment fairs in Calabanga in partnership with DOLE, PESO, and local and national employers. Job seekers are matched with employment opportunities both locally and abroad, with skills assessment and employment facilitation services available on-site.",
    eligibility: [
      "Job seekers who are residents of Calabanga",
      "Unemployed or underemployed individuals",
      "Fresh graduates and first-time job seekers",
      "Workers seeking better employment opportunities",
    ],
    requirements: [
      "Updated resume (at least 3 copies)",
      "Valid government-issued ID",
      "Transcript of records or diploma (if applicable)",
      "Training certificates and other relevant credentials",
    ],
    process: [
      "Monitor MSWD and LGU announcements for job fair schedules",
      "Register online or on-site on the day of the event",
      "Attend employer booths and submit applications",
      "Undergo pre-employment interviews on-site",
      "Await employer callback for final hiring decisions",
    ],
    faq: [
      { q: "Are job fairs free?", a: "Yes. Attendance is free for all job seekers. No registration fee is collected." },
      { q: "What types of jobs are typically available?", a: "Manufacturing, retail, BPO, hospitality, construction, government, healthcare, and overseas employment opportunities." },
    ],
  },
  tupad: {
    overview: "TUPAD (Tulong Panghanapbuhay sa Ating Displaced na Manggagawa) is a DOLE community-based emergency employment program providing 10–30 days of paid work to displaced workers, underemployed individuals, and seasonal workers through community improvement projects.",
    eligibility: [
      "Displaced workers due to disasters, industry closures, or economic shocks",
      "Underemployed and seasonal workers",
      "Residents of Calabanga, ages 18–60",
      "Not a regular government employee",
    ],
    requirements: [
      "Accomplished TUPAD application form",
      "Valid government-issued ID",
      "Barangay certification of residency and employment status",
      "SSS or PhilSys ID number",
    ],
    process: [
      "Submit application to MSWD or PESO Office",
      "Evaluation and selection of qualified beneficiaries",
      "Orientation on program guidelines and work assignment",
      "Deployment for 10–30 days on community projects",
      "Payment of wages after completion of work",
    ],
    faq: [
      { q: "What is the daily wage under TUPAD?", a: "TUPAD workers receive the applicable regional minimum wage for the duration of the work assignment." },
      { q: "What kind of work is assigned?", a: "Community improvement projects such as road clearing, facility painting, garden maintenance, and public space upkeep." },
    ],
  },
  "dole-livelihood": {
    overview: "The DOLE Livelihood Assistance program provides livelihood starter kits, grants, and equipment to displaced workers and vulnerable individuals to help them establish or sustain an income-generating activity and achieve greater self-sufficiency.",
    eligibility: [
      "Displaced workers and their families",
      "Underprivileged and vulnerable workers in the informal economy",
      "Residents of Calabanga, Camarines Sur",
      "Must not have received DOLE livelihood assistance within the past two years",
    ],
    requirements: [
      "Accomplished application and project proposal form",
      "Valid government-issued ID",
      "Barangay certification of residency",
      "Proof of displacement or vulnerability",
    ],
    process: [
      "Secure and accomplish the application form from MSWD or DOLE-RO V",
      "Submit documents to MSWD for endorsement",
      "Validation and site inspection by DOLE representatives",
      "Approval by the DOLE Regional Office",
      "Release of starter kit or livelihood grant",
    ],
    faq: [
      { q: "Is this a loan or a grant?", a: "This is a grant — it does not need to be repaid by the beneficiary." },
      { q: "What livelihood activities are covered?", a: "Food processing, sari-sari stores, backyard farming, handicrafts, services trades, and similar activities." },
    ],
  },
  sra: {
    overview: "The Special Recruitment Activity (SRA) is a POEA-authorized recruitment event allowing licensed agencies to recruit workers directly in areas outside Metro Manila. SRAs conducted in Calabanga give local residents direct access to overseas employment opportunities from pre-screened POEA-accredited employers.",
    eligibility: [
      "Filipino citizens legally qualified to work abroad",
      "Residents of Calabanga and surrounding municipalities",
      "Applicants meeting the specific job requirements of participating employers",
    ],
    requirements: [
      "Updated resume tailored to target position",
      "Valid passport or government-issued ID",
      "Educational credentials (TOR, diploma, certificates)",
      "Certificate of employment or proof of work experience",
    ],
    process: [
      "Register for the SRA event at MSWD or PESO Office",
      "Attend the pre-employment orientation",
      "Submit application documents to participating agencies",
      "Undergo initial screening and interview",
      "Complete documentation for overseas employment deployment",
    ],
    faq: [
      { q: "Is attendance at SRAs free?", a: "Yes. Attending an SRA is free. Normal POEA-approved placement fees may apply once hired." },
      { q: "When are SRAs scheduled?", a: "SRAs are held periodically throughout the year. Monitor MSWD, PESO, and LGU announcements for schedules." },
    ],
  },
  "ofw-profiling": {
    overview: "The OFW Profiling program registers and maintains an updated database of Overseas Filipino Workers from Calabanga, enabling the MSWD to monitor their welfare, facilitate access to OWWA and DOLE programs, and provide timely assistance to returning OFWs and their families.",
    eligibility: [
      "Active OFWs who are residents of Calabanga",
      "Returning OFWs (Balik-Manggagawa) from Calabanga",
      "OFW family members seeking access to OWWA programs",
    ],
    requirements: [
      "Valid Philippine Passport",
      "OWWA membership records or card",
      "Work contract (for active OFWs)",
      "Proof of Calabanga residency (barangay certification)",
    ],
    process: [
      "Visit MSWD Office with required documents",
      "Accomplish the OFW Registration Form",
      "Submit documents for encoding in the OFW database",
      "Receive acknowledgment receipt",
      "Update information periodically as employment status changes",
    ],
    faq: [
      { q: "Is OFW registration mandatory?", a: "Registration is voluntary but strongly encouraged to ensure access to government assistance and welfare programs." },
      { q: "Can a family member register on my behalf?", a: "Yes. A family member may register on behalf of the OFW with a written authorization letter." },
    ],
  },
  owwa: {
    overview: "The OWWA Officer Organization program supports the formation and development of local OWWA chapters in Calabanga. It coordinates OFW family welfare activities, facilitates OWWA member registration, and connects members to OWWA programs for reintegration, education, livelihood, and social protection.",
    eligibility: [
      "Active OWWA members from Calabanga",
      "OFW families registered with OWWA",
      "Returning OFWs who wish to join chapter activities",
    ],
    requirements: [
      "Valid OWWA membership and ID card",
      "Valid government-issued ID",
      "Accomplished membership update form (if applicable)",
    ],
    process: [
      "Contact MSWD for OWWA chapter meeting schedules",
      "Attend the general assembly or chapter meeting",
      "Submit or update membership information",
      "Participate in chapter welfare programs and activities",
    ],
    faq: [
      { q: "What programs does OWWA offer members?", a: "Education assistance, livelihood grants, skills training, death benefits, disability assistance, and OFW reintegration programs." },
      { q: "How do I check my OWWA membership status?", a: "Check your status online at owwa.gov.ph or visit the MSWD Office for assistance." },
    ],
  },
  "economic-relief": {
    overview: "The Economic Relief Assistance program provides immediate financial aid to individuals and families experiencing acute economic hardship due to sudden loss of income, livelihood disruption, or other pressing financial crises. It serves as a safety net to help residents of Calabanga stabilize their situation while long-term solutions are pursued.",
    eligibility: [
      "Residents of Calabanga, Camarines Sur",
      "Individuals or families experiencing economic crisis or loss of livelihood",
      "Without other available means of financial support",
      "Not receiving the same form of assistance from another agency within the same period",
    ],
    requirements: [
      "Valid government-issued ID",
      "Barangay Certificate of Indigency",
      "Proof of economic hardship (termination letter, medical bill, affidavit, etc.)",
      "Certificate of No Income or proof of reduced income",
    ],
    process: [
      "Visit the MSWD Office and explain the nature of economic hardship",
      "Submit required documents for social worker assessment",
      "Social case study and determination of eligibility",
      "Recommendation and approval by MSWD Head",
      "Release of financial assistance or referral to partner agencies",
    ],
    faq: [
      { q: "How much assistance can I receive?", a: "The amount varies based on assessed need and available funds. A social worker will determine the appropriate level of assistance." },
      { q: "How often can I apply?", a: "Economic relief is intended as emergency assistance. Repeat applications are subject to social worker evaluation and fund availability." },
    ],
  },
  "aics-cash-grants": {
    overview: "The Assistance to Individuals in Crisis Situations (AICS) Cash Grants program provides immediate financial relief to indigent individuals and families in Calabanga who are facing emergency circumstances such as medical crises, burial needs, transportation for treatment, economic displacement, or similar hardships. The program aims to alleviate acute distress and enable families to recover and regain stability.",
    eligibility: [
      "Residents of Calabanga, Camarines Sur",
      "Indigent individuals or families experiencing crisis situations",
      "Applicants not currently receiving the same form of assistance from another agency",
      "Those with verifiable urgent financial need assessed by a social worker",
    ],
    requirements: [
      "Valid government-issued ID",
      "Barangay Certificate of Indigency",
      "Document supporting the nature of crisis (medical certificate, hospital bill, death certificate, etc.)",
      "Certificate of No Income or proof of financial hardship",
    ],
    process: [
      "Walk in to the MSWD Office or contact a social worker",
      "Present valid ID and supporting documents",
      "Initial interview and social case assessment",
      "Determination of eligibility and appropriate assistance level",
      "Approval by the MSWD Head",
      "Release of cash grant assistance",
    ],
    faq: [
      { q: "What types of crisis are covered?", a: "Medical, burial, transportation, economic relief, and Balik Probinsya situations are covered under AICS." },
      { q: "How quickly can I receive assistance?", a: "AICS is designed for immediate response. Processing is done on the same day subject to fund availability and completeness of documents." },
    ],
  },
  "disaster-relief-ops": {
    overview: "MSWD Calabanga manages disaster relief operations and evacuation center management during and after calamities affecting the municipality. The program coordinates the distribution of food packs, relief goods, emergency financial assistance, and manages the safe and orderly operation of evacuation centers for displaced families across all 48 barangays.",
    eligibility: [
      "Residents of Calabanga affected by declared calamities or disasters",
      "Families displaced from their homes due to flooding, typhoons, fires, or earthquakes",
      "Individuals registered in evacuation centers under MSWD management",
      "Barangays with documented disaster-related damage",
    ],
    requirements: [
      "Valid government-issued ID or barangay certification",
      "Proof of residency in the affected barangay",
      "Accomplished Disaster Assistance Family Access Card (DAFAC)",
      "Damage assessment report from barangay officials (for housing assistance)",
    ],
    process: [
      "Report to the nearest evacuation center or barangay hall",
      "Register with the MSWD relief operations team",
      "Accomplish the DAFAC (Disaster Assistance Family Access Card)",
      "Receive relief goods, food packs, or cash assistance as available",
      "Social worker assessment for specialized assistance needs",
      "Referral to partner agencies for housing or livelihood recovery",
    ],
    faq: [
      { q: "How do I know if my area qualifies for relief assistance?", a: "Relief operations are activated upon declaration of a state of calamity or upon official assessment of disaster impact by the LGU and MSWD." },
      { q: "Can I receive assistance if I did not stay in an evacuation center?", a: "Yes. Affected families who sheltered with relatives or friends may still qualify for relief assistance upon documentation and verification." },
    ],
  },
  "eccd-day-care": {
    overview: "MSWD Calabanga manages 48 barangay Day Care Centers providing Early Childhood Care and Development (ECCD) services to children ages 3–4 across the municipality. Day care programs implement the National ECCD Curriculum, providing holistic development activities covering cognitive, social, emotional, and physical development domains to prepare children for formal schooling.",
    eligibility: [
      "Children ages 3–4 years old who are residents of Calabanga",
      "Children must be healthy and have no contraindication to group activities",
      "Priority given to children from low-income and vulnerable families",
      "Residents of the barangay where the day care center is located",
    ],
    requirements: [
      "PSA-authenticated Birth Certificate of the child",
      "Barangay Certificate of Residency",
      "Completed health assessment or medical clearance",
      "Accomplished Day Care Enrollment Form",
    ],
    process: [
      "Visit the nearest barangay Day Care Center during enrollment period",
      "Submit enrollment requirements to the Day Care Worker",
      "Child health and development assessment",
      "Enrollment confirmation and schedule assignment",
      "Attend parent orientation and home visitation schedule",
    ],
    faq: [
      { q: "Is day care enrollment free?", a: "Yes. Day care services are provided free of charge by the MSWD as a public service to all qualified Calabanga children." },
      { q: "When is the enrollment period?", a: "Enrollment is typically conducted at the start of the school year (June–July). Contact the nearest barangay day care center for the current schedule." },
    ],
  },
  "sfp": {
    overview: "The Supplemental Feeding Program (SFP) provides nutritional supplementation to malnourished and at-risk children enrolled in MSWD day care centers and public schools in Calabanga. The program aims to address undernutrition, improve the nutritional status of children, and support their cognitive and physical development through structured feeding activities and nutrition education.",
    eligibility: [
      "Children enrolled in MSWD day care centers in Calabanga",
      "Malnourished children (underweight, stunted, or wasted) identified through nutritional assessment",
      "Children ages 3–5 years enrolled in public kindergarten or pre-school",
      "Priority given to severely underweight and wasted children",
    ],
    requirements: [
      "Enrollment in an MSWD day care center or public school",
      "Nutritional assessment record (weight and height measurement)",
      "Parent or guardian consent form",
      "Barangay Certificate of Residency",
    ],
    process: [
      "Nutritional assessment conducted by the Day Care Worker",
      "Identification of malnourished and at-risk children",
      "Enrollment in the Supplemental Feeding Program",
      "Regular feeding sessions conducted at the day care center",
      "Monthly monitoring of weight and height for progress tracking",
      "Nutrition education sessions for parents and guardians",
    ],
    faq: [
      { q: "How long does the feeding program last?", a: "Feeding programs typically run for 120 days per cycle in accordance with DSWD and MSWD guidelines." },
      { q: "What food is provided in the feeding program?", a: "Nutritious meals and snacks aligned with FNRI dietary guidelines are prepared and served at the day care center." },
    ],
  },
  "child-protection": {
    overview: "MSWD Calabanga provides comprehensive Child Protection Services for children who are victims of abuse, neglect, exploitation, and trafficking, as well as custody-related cases. Social workers conduct case assessments, coordinate with the courts, the PNP Women and Children Protection Desk, and DSWD, and provide psychosocial support, legal assistance, and family intervention to ensure the safety and welfare of the child.",
    eligibility: [
      "Children below 18 years old who are residents of Calabanga",
      "Victims of physical, emotional, or sexual abuse, neglect, or exploitation",
      "Children involved in custody disputes requiring social case study",
      "Children at risk referred by barangays, schools, hospitals, or courts",
    ],
    requirements: [
      "Birth Certificate of the child (PSA-authenticated)",
      "Valid ID of the parent or guardian filing the complaint",
      "Medical certificate or medico-legal report (for abuse cases)",
      "Referral letter from barangay, school, hospital, or PNP (if applicable)",
    ],
    process: [
      "Report the case to the MSWD Office or the PNP WCPD",
      "Initial interview and case intake by the social worker",
      "Case assessment and social case study",
      "Coordination with PNP, courts, hospitals, or DSWD as appropriate",
      "Preparation of Social Case Study Report for legal proceedings",
      "Provision of psychosocial support and family intervention",
      "Case monitoring, follow-up, and aftercare",
    ],
    faq: [
      { q: "Is the child's identity protected?", a: "Yes. All child protection cases are strictly confidential. The child's identity and case details are protected under existing child protection laws." },
      { q: "Can a neighbor or teacher report a case?", a: "Yes. Any concerned person who suspects child abuse or neglect may report to MSWD or the barangay. Anonymous reports are accepted." },
    ],
  },
  "senior-citizen-osca": {
    overview: "MSWD Calabanga, in coordination with the Office for Senior Citizens Affairs (OSCA), provides welfare programs and services for residents 60 years and above. Services include OSCA ID issuance which grants access to senior citizen privileges under RA 9994 (Expanded Senior Citizens Act), social pension distribution for indigent seniors, and referral to health, livelihood, and social protection programs.",
    eligibility: [
      "Residents of Calabanga who are 60 years old and above",
      "Filipino citizens with no existing OSCA ID from another municipality",
      "Social pension: indigent senior citizens 60 years and above with no regular pension from SSS, GSIS, or similar",
    ],
    requirements: [
      "PSA-authenticated Birth Certificate",
      "Valid government-issued ID or Barangay Certificate with age",
      "2 pieces 1×1 ID photos",
      "Barangay Certificate of Residency in Calabanga",
      "For social pension: Certificate of No SSS/GSIS Pension",
    ],
    process: [
      "Visit the MSWD Office or the OSCA Office in Calabanga",
      "Submit OSCA ID application with required documents",
      "Photo capture and data encoding",
      "OSCA ID release (within processing period)",
      "For social pension: social worker assessment and DSWD enrollment",
    ],
    faq: [
      { q: "What privileges does the OSCA ID provide?", a: "Senior citizens are entitled to 20% discount and VAT exemption on medicines, food, and services as provided under RA 9994." },
      { q: "How much is the social pension?", a: "The DSWD Social Pension for indigent senior citizens is ₱500 per month per eligible beneficiary." },
    ],
  },
  "pwd-registry": {
    overview: "MSWD Calabanga manages the PWD Desk providing registration, ID issuance, and referral services for Persons with Disabilities (PWDs) in the municipality. The PWD ID grants access to government privileges, discounts, and social protection programs under RA 7277 (Magna Carta for Disabled Persons) as amended by RA 9442 and RA 10754. MSWD also facilitates enrollment in DSWD's social pension and livelihood programs for qualified PWDs.",
    eligibility: [
      "Residents of Calabanga with a recognized disability",
      "Disability must be a physical, mental, or sensory impairment as defined under RA 7277",
      "First-time applicants or those renewing an expired PWD ID",
      "For social pension: indigent PWDs without regular pension",
    ],
    requirements: [
      "PSA-authenticated Birth Certificate",
      "Medical Certificate from a licensed physician or specialist",
      "Disability Assessment Report (for specific disability types)",
      "Valid government-issued ID or Barangay Certificate",
      "2 pieces 1×1 ID photos",
    ],
    process: [
      "Visit the MSWD Office — PWD Desk",
      "Submit application form and required documents",
      "Medical assessment review by the social worker",
      "Data encoding and ID processing",
      "PWD ID release (within standard processing period)",
      "Referral to social pension, livelihood, or health programs as applicable",
    ],
    faq: [
      { q: "What discounts does a PWD ID provide?", a: "PWD ID holders are entitled to 20% discount and VAT exemption on medicines, medical services, and other covered establishments under RA 10754." },
      { q: "How long is the PWD ID valid?", a: "PWD IDs issued under NCDA guidelines are valid for 3 years. Renewal must be processed at the same issuing MSWD Office." },
    ],
  },
  "solo-parent-registry": {
    overview: "MSWD Calabanga administers the Solo Parent Support Program under RA 8972 (Solo Parents' Welfare Act), providing Solo Parent ID issuance and access to program benefits including flexible work arrangement rights, parental leave, educational benefits, housing program priority, and psychosocial support. The MSWD maintains the local solo parent registry to facilitate program delivery and coordinate with national agencies.",
    eligibility: [
      "Single parents carrying the primary responsibility of raising a child or children",
      "Includes unwed mothers/fathers, widowed parents, parents of children with disability, and other categories under RA 8972",
      "Must be a resident of Calabanga, Camarines Sur",
      "With a dependent child below 18 years of age, or a child with disability regardless of age",
    ],
    requirements: [
      "Accomplished Solo Parent ID Application Form",
      "PSA-authenticated Birth Certificate of the child/children",
      "Valid government-issued ID",
      "Proof of solo parent status (death certificate, court order, affidavit, etc.)",
      "Barangay Certificate of Residency in Calabanga",
    ],
    process: [
      "Visit the MSWD Office and request the Solo Parent ID Application Form",
      "Submit completed form and required documents",
      "Social worker interview and case assessment",
      "Verification and encoding in the solo parent registry",
      "Solo Parent ID issuance",
      "Orientation on program benefits and services available",
    ],
    faq: [
      { q: "Is the Solo Parent ID the same as a government ID?", a: "The Solo Parent ID is an MSWD-issued ID that grants access to benefits under RA 8972. It is recognized for program eligibility but is not a primary government ID." },
      { q: "How long is the Solo Parent ID valid?", a: "Solo Parent IDs are typically valid for 1 year and must be renewed annually at the MSWD Office." },
    ],
  },
};

// ─── DOWNLOADABLE FORMS ──────────────────────────────────────

const FORMS = [
  { label: "Solo Parent ID Application Form", file: "solo-parent-id-form.pdf" },
  { label: "PWD ID Application Form", file: "pwd-id-application.pdf" },
  { label: "AICS Application Form", file: "aics-application.pdf" },
  { label: "Emergency Shelter Assistance Form", file: "esa-form.pdf" },
  { label: "TUPAD Application Form", file: "tupad-application.pdf" },
  { label: "OFW Profiling Form", file: "ofw-profiling-form.pdf" },
];

// ─── TOP NAVIGATION ──────────────────────────────────────────

function TopNav({
  nav, onNav, onLogin, onRegister,
}: {
  nav: NavState;
  onNav: (s: NavState) => void;
  onLogin: () => void;
  onRegister: () => void;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const servicesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (servicesRef.current && !servicesRef.current.contains(e.target as Node)) {
        setServicesOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function go(page: PageId, category?: string, service?: string) {
    onNav({ page, category, service });
    setMobileOpen(false);
    setServicesOpen(false);
  }

  const isServiceArea = ["services", "category", "service-detail"].includes(nav.page);

 return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      {/* Government strip */}
      <div className="bg-blue-900 text-white">
        
        {/* FIX: Replaced max-w-7xl mx-auto with w-full. 
            Used pl-2 (padding-left) to push it almost to the edge. */}
        <div className="w-full pl-2 pr-4 py-1.5 flex items-center justify-between">
          
          <span className="flex items-center gap-1 text-xs text-blue-200">
            <Globe className="size-3" />
            Republic of the Philippines — Municipality of Calabanga, Camarines Sur
          </span>
          
          <span className="hidden sm:flex items-center gap-4 text-xs text-blue-300">
            <span className="flex items-center gap-1">
              <Clock className="size-3" />
              Mon–Fri 8:00 AM–5:00 PM
            </span>
            <span className="flex items-center gap-1">
              <Phone className="size-3" />
              (054) 871-1234
            </span>
          </span>
          
        </div>
      </div>

      {/* Main navigation */}
      {/* FIX: Replaced max-w-7xl mx-auto with w-full, and px-4 with pl-2 pr-4 to match the top strip */}
      <nav className="w-full pl-2 pr-4 border-b border-gray-100">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button
            onClick={() => go("home")}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <div className="size-10 rounded-full bg-blue-900 flex items-center justify-center flex-shrink-0">
              <Shield className="size-5 text-white" />
            </div>
            <div className="text-left">
              <div
                className="text-sm font-bold text-blue-900 leading-tight"
                style={{ fontFamily: "'Libre Franklin', sans-serif" }}
              >
                MSWD Calabanga
              </div>
              <div className="text-xs text-gray-500 leading-tight hidden sm:block">
                Municipal Social Welfare &amp; Development
              </div>
            </div>
          </button>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            <button
              onClick={() => go("home")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                nav.page === "home" ? "text-blue-700 bg-blue-50" : "text-gray-700 hover:text-blue-700 hover:bg-gray-50"
              }`}
            >
              Home
            </button>
            <button
              onClick={() => go("about")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                nav.page === "about" ? "text-blue-700 bg-blue-50" : "text-gray-700 hover:text-blue-700 hover:bg-gray-50"
              }`}
            >
              About Us
            </button>

            {/* Services mega dropdown */}
<div className="relative" ref={servicesRef}>
  <button
    onClick={() => setServicesOpen(!servicesOpen)}
    className={`flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
      isServiceArea ? "text-blue-700 bg-blue-50" : "text-gray-700 hover:text-blue-700 hover:bg-gray-50"
    }`}
  >
    Services
    <ChevronDown
      className={`size-4 transition-transform ${servicesOpen ? "rotate-180" : ""}`}
    />
  </button>

  {servicesOpen && (
    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-[400px] bg-white rounded-xl shadow-2xl border border-gray-200 py-3 z-50">
      {CATEGORIES.map((cat, ci) => {
        const Icon = IconMap[cat.icon];
        return (
          <div key={cat.id} className={ci > 0 ? "mt-1 pt-1 border-t border-gray-100" : ""}>
            <button
              onClick={() => go("category", cat.id)}
              className="flex items-center gap-2.5 w-full px-4 py-2 hover:bg-gray-50 text-left group transition-colors"
            >
              <div className={`size-6 rounded ${cat.lightBg} flex items-center justify-center flex-shrink-0`}>
                {Icon && <Icon className={`size-3.5 ${cat.textColor}`} />}
              </div>
              <span className="text-sm font-semibold text-gray-900 group-hover:text-blue-800 truncate">{cat.title}</span>
            </button>
          </div>
        );
      })}
      <div className="border-t border-gray-100 mt-2 pt-2 px-4">
        <button
          onClick={() => go("services")}
          className="text-sm text-blue-700 font-semibold hover:underline"
        >
          View All Services &amp; Programs →
        </button>
      </div>
    </div>
  )}
</div>

            <button
              onClick={onRegister}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-700 hover:bg-gray-50 rounded-md transition-colors"
            >
              Register
            </button>
            <button
              onClick={onLogin}
              className="ml-1 px-5 py-2 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors"
            >
              Login
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-gray-700 hover:bg-gray-100 rounded-lg"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-100 py-3 space-y-1 pb-4">
            <button
              onClick={() => go("home")}
              className="w-full text-left px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
            >
              Home
            </button>
            <button
              onClick={() => go("about")}
              className="w-full text-left px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
            >
              About Us
            </button>
            <button
              onClick={() => go("services")}
              className="w-full text-left px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
            >
              All Services
            </button>
            <div className="pl-2 space-y-0">
              {CATEGORIES.map(cat => {
                const Icon = IconMap[cat.icon];
                return (
                  <div key={cat.id}>
                    <button
                      onClick={() => go("category", cat.id)}
                      className="w-full text-left px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 rounded-lg flex items-center gap-2"
                    >
                      <div className={`size-5 rounded ${cat.lightBg} flex items-center justify-center flex-shrink-0`}>
                        {Icon && <Icon className={`size-3 ${cat.textColor}`} />}
                      </div>
                      <span className="truncate">{cat.title}</span>
                    </button>
                    {cat.services.map(svc => (
                      <button
                        key={svc.id}
                        onClick={() => go("service-detail", cat.id, svc.id)}
                        className="w-full text-left pl-10 pr-3 py-1.5 text-xs text-gray-500 hover:bg-gray-50 hover:text-blue-700 rounded-lg flex items-center gap-2"
                      >
                        <span className="size-1.5 rounded-full bg-gray-300 flex-shrink-0" />
                        <span className="truncate">{svc.title}</span>
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
            <div className="pt-2 px-1 flex flex-col gap-2">
              <button
                onClick={onRegister}
                className="w-full py-2.5 text-sm font-semibold text-gray-700 hover:text-blue-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                Register
              </button>
              <button
                onClick={onLogin}
                className="w-full py-2.5 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors"
              >
                Login to Portal
              </button>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}

// ─── FOOTER ──────────────────────────────────────────────────

function Footer({
  onNav, onLogin,
}: {
  onNav: (s: NavState) => void;
  onLogin: () => void;
}) {
  return (
    <footer className="bg-blue-950 text-white">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="size-9 rounded-full bg-blue-800 flex items-center justify-center">
                <Shield className="size-4 text-white" />
              </div>
              <div>
                <div
                  className="font-bold text-sm"
                  style={{ fontFamily: "'Libre Franklin', sans-serif" }}
                >
                  MSWD Calabanga
                </div>
                <div className="text-xs text-blue-400">Municipal Social Welfare</div>
              </div>
            </div>
            <p className="text-sm text-blue-300 leading-relaxed mb-5">
              Committed to the welfare and development of every citizen in the municipality of Calabanga, Camarines Sur.
            </p>
            <div className="flex gap-2">
              <a
                href="#"
                aria-label="Facebook"
                className="size-8 rounded-full bg-blue-800 hover:bg-blue-700 flex items-center justify-center transition-colors"
              >
                <Facebook className="size-4" />
              </a>
              <a
                href="#"
                aria-label="YouTube"
                className="size-8 rounded-full bg-blue-800 hover:bg-blue-700 flex items-center justify-center transition-colors"
              >
                <Youtube className="size-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-4">
              Quick Links
            </h3>
            <ul className="space-y-2 text-sm text-blue-200">
              {[
                { label: "Home", page: "home" as PageId },
                { label: "About Us", page: "about" as PageId },
                { label: "All Services", page: "services" as PageId },
              ].map(link => (
                <li key={link.label}>
                  <button
                    onClick={() => onNav({ page: link.page })}
                    className="hover:text-white transition-colors"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
              <li>
                <button
                  onClick={onLogin}
                  className="hover:text-white transition-colors"
                >
                  Staff Login
                </button>
              </li>
            </ul>
          </div>

          {/* Programs */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-4">
              Our Programs
            </h3>
            <ul className="space-y-2 text-sm text-blue-200">
              {CATEGORIES.map(cat => (
                <li key={cat.id}>
                  <button
                    onClick={() => onNav({ page: "category", category: cat.id })}
                    className="hover:text-white transition-colors text-left"
                  >
                    {cat.title}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-4">
              Contact Us
            </h3>
            <ul className="space-y-3 text-sm text-blue-200">
              <li className="flex items-start gap-2">
                <MapPin className="size-4 mt-0.5 flex-shrink-0 text-blue-400" />
                <span>Municipal Hall Complex, Calabanga, Camarines Sur 4405</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="size-4 flex-shrink-0 text-blue-400" />
                <span>(054) 871-1234</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="size-4 flex-shrink-0 text-blue-400" />
                <span>mswd.calabanga@gmail.com</span>
              </li>
              <li className="flex items-start gap-2">
                <Clock className="size-4 mt-0.5 flex-shrink-0 text-blue-400" />
                <div>
                  <div>Monday – Friday</div>
                  <div>8:00 AM – 5:00 PM</div>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-blue-900">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-blue-500">
          <span>© 2025 MSWD Calabanga. All rights reserved.</span>
          <span>Republic of the Philippines — Municipality of Calabanga, Camarines Sur</span>
        </div>
      </div>
    </footer>
  );
}

// ─── HOME PAGE ───────────────────────────────────────────────

function HomePage({
  onNav, onLogin, onRegister,
}: {
  onNav: (s: NavState) => void;
  onLogin: () => void;
  onRegister: () => void;
}) {
 
return (
    <div>
      {/* HERO */}
      <section className="relative bg-blue-900 text-white overflow-hidden min-h-[88vh] flex items-center">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "48px 48px",
          }}
        />
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-5"
          style={{ background: "linear-gradient(to left, white, transparent)" }} />

        <div className="relative w-full pl-16 pr-4">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-blue-800/60 border border-blue-700 px-3 py-1.5 rounded-full text-xs font-medium mb-6 text-blue-200">
              <Bell className="size-3" />
              Official MSWD Public Portal — Calabanga, Camarines Sur
            </div>
            <h1
              className="text-4xl md:text-5xl font-extrabold text-white leading-tight mb-5"
              style={{ fontFamily: "'Libre Franklin', sans-serif" }}
            >
              <span className="whitespace-nowrap">Serving Every Calabangueño</span><br />
              with Dignity.
            </h1>
            
            <p className="text-blue-200 text-lg leading-relaxed mb-8 max-w-2xl">
              The Municipal Social Welfare and Development Office of Calabanga<br />
              provides comprehensive social protection, welfare programs,<br />
              and livelihood assistance to all residents across 48 barangays.
            </p>

            <div className="flex flex-wrap gap-3 mt-2">
              <button
                onClick={onRegister}
                className="px-5 py-3 bg-white text-blue-900 text-sm font-semibold rounded-lg hover:bg-gray-100 transition-colors"
              >
                Register
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* PROGRAMS OVERVIEW */}
      <section className="py-14">
        {/* CHANGED: Replaced max-w-7xl mx-auto px-4 with w-full pl-16 pr-4 to align with the Hero */}
        <div className="w-full pl-16 pr-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2
                className="text-2xl font-bold text-blue-900"
                style={{ fontFamily: "'Libre Franklin', sans-serif" }}
              >
                Programs &amp; Services
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                Comprehensive welfare services for all Calabangueños across 3 sectors and 8 programs
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {CATEGORIES.map(cat => {
              const Icon = IconMap[cat.icon];
              return (
                <button
                  key={cat.id}
                  onClick={() => onNav({ page: "category", category: cat.id })}
                  className="text-left bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-gray-300 transition-all group"
                >
                  <div
                    className={`size-11 rounded-xl ${cat.lightBg} flex items-center justify-center mb-4`}
                  >
                    {Icon && <Icon className={`size-5 ${cat.textColor}`} />}
                  </div>
                  <h3
                    className="font-bold text-gray-900 text-sm mb-2"
                    style={{ fontFamily: "'Libre Franklin', sans-serif" }}
                  >
                    {cat.title}
                  </h3>
                  <p className="text-xs text-gray-500 leading-relaxed mb-3">
                    {cat.description}
                  </p>
                  <div
                    className={`flex items-center gap-1 text-xs font-semibold ${cat.textColor} group-hover:gap-2 transition-all`}
                  >
                    {cat.services.length} services <ArrowRight className="size-3" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

    </div>
  );
}

// ─── ABOUT PAGE ──────────────────────────────────────────────

function AboutPage({ onNav }: { onNav: (s: NavState) => void }) {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      q: "Who can avail of MSWD services?",
      a: "MSWD services are available to all residents of Calabanga. Most programs prioritize indigent, vulnerable, and marginalized individuals and families.",
    },
    {
      q: "What are your office hours?",
      a: "The MSWD Office is open Monday to Friday, 8:00 AM to 5:00 PM. The office is closed on weekends and national public holidays.",
    },
    {
      q: "Do I need to make an appointment?",
      a: "Walk-in clients are accepted. For social case study and counseling, it is advisable to call ahead to ensure a social worker is available to serve you.",
    },
    {
      q: "How long does it take to process an application?",
      a: "Processing time varies per program. Emergency assistance (AICS) is typically processed within 1–3 working days. IDs (PWD, Solo Parent) take 3–7 working days.",
    },
    {
      q: "Is there a fee for MSWD services?",
      a: "No. All MSWD programs and services are provided free of charge to qualified beneficiaries.",
    },
    {
      q: "Can I apply for multiple programs at the same time?",
      a: "Yes. If you qualify for multiple programs, you may apply for each one. A social worker will assess your eligibility and priority needs.",
    },
  ];

  return (
    <div>
      {/* Page header */}
      <div className="bg-blue-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex items-center gap-2 text-blue-300 text-sm mb-4">
            <button onClick={() => onNav({ page: "home" })} className="hover:text-white">
              Home
            </button>
            <ChevronRight className="size-3" />
            <span className="text-white">About Us</span>
          </nav>
          <h1
            className="text-3xl font-bold text-white"
            style={{ fontFamily: "'Libre Franklin', sans-serif" }}
          >
            About MSWD Calabanga
          </h1>
          <p className="text-blue-200 mt-2 text-sm max-w-xl">
            Learn about our office, our mandate, and our commitment to every Calabangueño.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Overview + Info card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-2">
            <h2
              className="text-xl font-bold text-blue-900 mb-4"
              style={{ fontFamily: "'Libre Franklin', sans-serif" }}
            >
              Office Overview
            </h2>
            <div className="text-sm text-gray-600 leading-relaxed space-y-3">
              <p>
                The Municipal Social Welfare and Development (MSWD) Office of Calabanga, Camarines Sur is the local government unit responsible for implementing social welfare and development programs, projects, and services for the most vulnerable and marginalized sectors of the community.
              </p>
              <p>
                The office operates within the national framework of the Department of Social Welfare and Development (DSWD) and collaborates with partner agencies such as DOLE, OWWA, PhilHealth, and DILG to deliver comprehensive welfare assistance across all 48 barangays of Calabanga.
              </p>
              <p>
                MSWD Calabanga focuses on addressing poverty, social inequality, and the needs of disadvantaged groups — including children in conflict with the law, day care enrollees, malnourished children, solo parents, persons with disabilities, senior citizens, and families affected by disasters.
              </p>
              <p>
                Staffed by licensed social workers, day care workers, and program coordinators, the office maintains a presence in every barangay and ensures that services are responsive, timely, and accessible to all who need them.
              </p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
              <h3
                className="text-sm font-bold text-blue-900 mb-4"
                style={{ fontFamily: "'Libre Franklin', sans-serif" }}
              >
                Office Information
              </h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2.5 text-gray-700">
                  <MapPin className="size-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>Municipal Hall Complex, Calabanga, Camarines Sur 4405</span>
                </li>
                <li className="flex items-center gap-2.5 text-gray-700">
                  <Phone className="size-4 text-blue-600 flex-shrink-0" />
                  <span>(054) 871-1234</span>
                </li>
                <li className="flex items-center gap-2.5 text-gray-700">
                  <Mail className="size-4 text-blue-600 flex-shrink-0" />
                  <span>mswd.calabanga@gmail.com</span>
                </li>
                <li className="flex items-start gap-2.5 text-gray-700">
                  <Clock className="size-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-semibold">Monday – Friday</div>
                    <div>8:00 AM – 5:00 PM</div>
                    <div className="text-xs text-gray-400 mt-0.5">Closed on weekends &amp; holidays</div>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="mb-12">
          <h2
            className="text-xl font-bold text-blue-900 mb-4"
            style={{ fontFamily: "'Libre Franklin', sans-serif" }}
          >
            Office Location
          </h2>
          <div className="rounded-xl overflow-hidden border border-gray-200 bg-blue-50" style={{ height: "320px" }}>
            <iframe
              title="MSWD Calabanga Location"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d31533.55!2d123.5062!3d13.7137!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x33a1a4b5!2sCalaanga%2C+Camarines+Sur!5e0!3m2!1sen!2sph!4v1"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
          <p className="text-xs text-gray-400 mt-2">
            MSWD Office is located at the Municipal Hall Complex, Calabanga, Camarines Sur.
          </p>
        </div>

        {/* Mission & Vision */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-12">
          <div className="bg-blue-900 text-white rounded-xl p-6">
            <h3
              className="text-lg font-bold mb-3"
              style={{ fontFamily: "'Libre Franklin', sans-serif" }}
            >
              Mission
            </h3>
            <p className="text-blue-100 text-sm leading-relaxed">
              To provide comprehensive, accessible, and responsive social welfare and development services that promote the well-being and self-reliance of every individual, family, and community in Calabanga — with special attention to the most vulnerable sectors including children, youth, women, persons with disabilities, senior citizens, and those in crisis situations.
            </p>
          </div>
          <div className="bg-green-700 text-white rounded-xl p-6">
            <h3
              className="text-lg font-bold mb-3"
              style={{ fontFamily: "'Libre Franklin', sans-serif" }}
            >
              Vision
            </h3>
            <p className="text-green-50 text-sm leading-relaxed">
              A community where every Calabangueño lives with dignity, has equal access to opportunities, and is protected from all forms of abuse, neglect, and exploitation — a society where the most vulnerable are uplifted and empowered to contribute to the progress of their families, communities, and the nation.
            </p>
          </div>
        </div>

        {/* FAQ */}
        <div>
          <h2
            className="text-xl font-bold text-blue-900 mb-6"
            style={{ fontFamily: "'Libre Franklin', sans-serif" }}
          >
            Frequently Asked Questions
          </h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="border border-gray-200 rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="text-sm font-semibold text-gray-900 pr-4">
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={`size-4 text-gray-400 flex-shrink-0 transition-transform ${
                      openFaq === i ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-4 pb-4 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SERVICES OVERVIEW ───────────────────────────────────────

function ServicesOverview({ onNav }: { onNav: (s: NavState) => void }) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  interface FlatService extends ServiceInfo {
    categoryId: string;
    categoryTitle: string;
    textColor: string;
    lightBg: string;
  }

  const allServices: FlatService[] = CATEGORIES.flatMap(cat =>
    cat.services.map(svc => ({
      ...svc,
      categoryId: cat.id,
      categoryTitle: cat.title,
      textColor: cat.textColor,
      lightBg: cat.lightBg,
    }))
  );

  const filtered = allServices.filter(svc => {
    const q = search.toLowerCase();
    const matchSearch =
      q === "" ||
      svc.title.toLowerCase().includes(q) ||
      svc.description.toLowerCase().includes(q) ||
      svc.category.toLowerCase().includes(q);
    const matchCat =
      activeCategory === "all" || svc.categoryId === activeCategory;
    return matchSearch && matchCat;
  });

  return (
    <div>
      <div className="bg-blue-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex items-center gap-2 text-blue-300 text-sm mb-4">
            <button onClick={() => onNav({ page: "home" })} className="hover:text-white">
              Home
            </button>
            <ChevronRight className="size-3" />
            <span className="text-white">All Services</span>
          </nav>
          <h1
            className="text-3xl font-bold"
            style={{ fontFamily: "'Libre Franklin', sans-serif" }}
          >
            MSWD Programs &amp; Services
          </h1>
          <p className="text-blue-200 mt-2 text-sm max-w-xl">
            Browse all social welfare programs and services organized by category.
          </p>
          <div className="mt-6 relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search services..."
              className="w-full h-11 pl-10 pr-4 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 border-0"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Category filters */}
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => setActiveCategory("all")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeCategory === "all"
                ? "bg-blue-700 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            All Programs ({allServices.length})
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeCategory === cat.id
                  ? `${cat.bgColor} text-white`
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {cat.title} ({cat.services.length})
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Search className="size-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No services found matching your search.</p>
            <button
              onClick={() => setSearch("")}
              className="mt-2 text-sm text-blue-600 hover:underline"
            >
              Clear search
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(svc => {
              const Icon = IconMap[svc.icon];
              return (
                <button
                  key={svc.id}
                  onClick={() =>
                    onNav({
                      page: "service-detail",
                      service: svc.id,
                      category: svc.categoryId,
                    })
                  }
                  className="text-left bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-gray-300 transition-all group"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div
                      className={`size-10 rounded-lg ${svc.lightBg} flex items-center justify-center flex-shrink-0`}
                    >
                      {Icon && <Icon className={`size-5 ${svc.textColor}`} />}
                    </div>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full mt-0.5 ${svc.lightBg} ${svc.textColor}`}
                    >
                      {svc.category}
                    </span>
                  </div>
                  <h3
                    className="font-bold text-gray-900 text-sm mb-2"
                    style={{ fontFamily: "'Libre Franklin', sans-serif" }}
                  >
                    {svc.title}
                  </h3>
                  <p className="text-xs text-gray-500 leading-relaxed mb-3">
                    {svc.description}
                  </p>
                  <div
                    className={`flex items-center gap-1 text-xs font-semibold ${svc.textColor} group-hover:gap-2 transition-all`}
                  >
                    Learn More <ArrowRight className="size-3" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── CATEGORY DASHBOARD ──────────────────────────────────────

function CategoryDashboard({
  categoryId, onNav,
}: {
  categoryId: string;
  onNav: (s: NavState) => void;
}) {
  const cat = CATEGORY_MAP[categoryId];
  if (!cat) return null;

  const Icon = IconMap[cat.icon];

  return (
    <div>
      <div className={`${cat.bgColor} text-white py-12`}>
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex items-center gap-2 text-white/70 text-sm mb-5 flex-wrap">
            <button onClick={() => onNav({ page: "home" })} className="hover:text-white">
              Home
            </button>
            <ChevronRight className="size-3" />
            <button onClick={() => onNav({ page: "services" })} className="hover:text-white">
              Services
            </button>
            <ChevronRight className="size-3" />
            <span className="text-white">{cat.title}</span>
          </nav>
          <div className="flex items-start gap-4">
            <div className="size-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              {Icon && <Icon className="size-6 text-white" />}
            </div>
            <div>
              <h1
                className="text-3xl font-bold text-white"
                style={{ fontFamily: "'Libre Franklin', sans-serif" }}
              >
                {cat.title}
              </h1>
              <p className="text-white/80 mt-1 text-sm">{cat.description}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-6 text-sm text-gray-500">
          {cat.services.length} programs available under this category
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {cat.services.map(svc => {
            const SvcIcon = IconMap[svc.icon];
            return (
              <button
                key={svc.id}
                onClick={() =>
                  onNav({
                    page: "service-detail",
                    service: svc.id,
                    category: cat.id,
                  })
                }
                className="text-left bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md hover:border-gray-300 transition-all group"
              >
                <div
                  className={`size-11 rounded-xl ${cat.lightBg} flex items-center justify-center mb-4`}
                >
                  {SvcIcon && <SvcIcon className={`size-5 ${cat.textColor}`} />}
                </div>
                <div className={`text-xs font-semibold mb-2 ${cat.textColor}`}>
                  {svc.category}
                </div>
                <h3
                  className="font-bold text-gray-900 mb-2"
                  style={{ fontFamily: "'Libre Franklin', sans-serif" }}
                >
                  {svc.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-4">
                  {svc.description}
                </p>
                <div
                  className={`flex items-center gap-1 text-sm font-semibold ${cat.textColor} group-hover:gap-2 transition-all`}
                >
                  View Details <ArrowRight className="size-4" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── SERVICE DETAIL PAGE ─────────────────────────────────────

function ServiceDetail({
  serviceId, categoryId, onNav, onLogin,
}: {
  serviceId: string;
  categoryId?: string;
  onNav: (s: NavState) => void;
  onLogin: () => void;
}) {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const svc = SERVICE_MAP[serviceId];
  const detail = SERVICE_DETAILS[serviceId];
  const resolvedCatId = categoryId ?? svc?.categoryId;
  const cat = resolvedCatId ? CATEGORY_MAP[resolvedCatId] : null;

  if (!svc || !detail || !cat) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-gray-400">
        <p className="text-sm">Service details not found.</p>
        <button
          onClick={() => onNav({ page: "services" })}
          className="mt-4 text-sm text-blue-600 hover:underline"
        >
          Back to Services
        </button>
      </div>
    );
  }

  const Icon = IconMap[svc.icon];

  return (
    <div>
      {/* Header */}
      <div className={`${cat.bgColor} text-white py-12`}>
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex items-center gap-2 text-white/70 text-sm mb-5 flex-wrap">
            <button onClick={() => onNav({ page: "home" })} className="hover:text-white">
              Home
            </button>
            <ChevronRight className="size-3" />
            <button onClick={() => onNav({ page: "services" })} className="hover:text-white">
              Services
            </button>
            <ChevronRight className="size-3" />
            <button
              onClick={() => onNav({ page: "category", category: cat.id })}
              className="hover:text-white"
            >
              {cat.title}
            </button>
            <ChevronRight className="size-3" />
            <span className="text-white">{svc.title}</span>
          </nav>
          <div className="flex items-start gap-4">
            <div className="size-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              {Icon && <Icon className="size-6 text-white" />}
            </div>
            <div>
              <div className="text-xs font-semibold text-white/70 mb-1 uppercase tracking-wider">
                {svc.category}
              </div>
              <h1
                className="text-3xl font-bold text-white"
                style={{ fontFamily: "'Libre Franklin', sans-serif" }}
              >
                {svc.title}
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-10">
            {/* Overview */}
            <div>
              <h2
                className="text-lg font-bold text-blue-900 mb-3"
                style={{ fontFamily: "'Libre Franklin', sans-serif" }}
              >
                Program Overview
              </h2>
              <p className="text-sm text-gray-600 leading-relaxed">{detail.overview}</p>
            </div>

            {/* Eligibility */}
            <div>
              <h2
                className="text-lg font-bold text-blue-900 mb-4"
                style={{ fontFamily: "'Libre Franklin', sans-serif" }}
              >
                Eligibility Requirements
              </h2>
              <ul className="space-y-3">
                {detail.eligibility.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-gray-700">
                    <div
                      className={`size-5 rounded-full ${cat.lightBg} flex items-center justify-center flex-shrink-0 mt-0.5`}
                    >
                      <Check className={`size-3 ${cat.textColor}`} />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Requirements */}
            <div>
              <h2
                className="text-lg font-bold text-blue-900 mb-4"
                style={{ fontFamily: "'Libre Franklin', sans-serif" }}
              >
                Documentary Requirements
              </h2>
              <ul className="space-y-3">
                {detail.requirements.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-gray-700">
                    <div className="size-5 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold text-gray-500">
                      {i + 1}
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Walk-in Application Process */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl overflow-hidden">
              <div className="bg-amber-600 px-5 py-4 flex items-center gap-3">
                <div className="size-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <MapPin className="size-4 text-white" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white" style={{ fontFamily: "'Libre Franklin', sans-serif" }}>Walk-in Application Process</h2>
                  <p className="text-amber-100 text-xs mt-0.5">For residents visiting the MSWD Office in person</p>
                </div>
              </div>
              <div className="p-5 space-y-3">
                {[
                  { step: 1, title: "Visit MSWD Calabanga Office", desc: "Go to the MSWD Office, Municipal Hall Complex, Calabanga, Camarines Sur (Mon–Fri, 8:00 AM – 5:00 PM)." },
                  { step: 2, title: "Beneficiary Profile Check", desc: "Staff searches for your existing Beneficiary Profile in the system. If no profile exists, you will be assisted in creating an Individual or Family Beneficiary Profile." },
                  { step: 3, title: "Service Application Created", desc: "Staff records your service application in the system with your profile information auto-filled." },
                  { step: 4, title: "Submit Required Documents", desc: `Present the required documents for ${svc.title}: ${detail.requirements.slice(0, 3).join(", ")}${detail.requirements.length > 3 ? ", and others." : "."}` },
                  { step: 5, title: "Staff Verifies Information", desc: "The social worker reviews your application, conducts an interview, and validates submitted documents." },
                  { step: 6, title: "Application Status Updated", desc: "Your application is processed and updated to one of the following statuses: Pending Verification, Approved, For Revision, or Rejected." },
                ].map(({ step, title, desc }) => (
                  <div key={step} className="flex items-start gap-4">
                    <div className="size-7 rounded-full bg-amber-600 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">{step}</div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{title}</p>
                      <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
                <div className="mt-4 pt-3 border-t border-amber-200">
                  <p className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-2">Application Statuses</p>
                  <div className="flex flex-wrap gap-2">
                    {["Pending Verification", "Approved", "For Revision", "Rejected"].map(s => (
                      <span key={s} className="text-xs px-2.5 py-1 rounded-full bg-white border border-amber-300 text-amber-800 font-medium">{s}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Online Application Process */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl overflow-hidden">
              <div className="bg-blue-700 px-5 py-4 flex items-center gap-3">
                <div className="size-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Globe className="size-4 text-white" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white" style={{ fontFamily: "'Libre Franklin', sans-serif" }}>Online Application Process</h2>
                  <p className="text-blue-200 text-xs mt-0.5">For registered beneficiaries using the Client Portal</p>
                </div>
              </div>
              <div className="p-5 space-y-3">
                {[
                  { step: 1, title: "Login to Beneficiary Portal", desc: "Access the MSWD Calabanga Beneficiary Portal using your registered account credentials." },
                  { step: 2, title: "System Checks Beneficiary Profile", desc: "The system automatically checks if you have an existing registered Beneficiary Profile. If no profile exists, you must complete profile registration first before proceeding." },
                  { step: 3, title: "Select Apply for Service", desc: "From your dashboard, click the \"Apply for Service\" button to begin a new application." },
                  { step: 4, title: "Choose Service Category", desc: `Select the appropriate service category and choose "${svc.title}" from the list of available services.` },
                  { step: 5, title: "Complete Application Form", desc: "Fill out the service-specific application form. Your profile information (name, address, contact) is auto-filled — no need to re-enter." },
                  { step: 6, title: "Upload Required Documents", desc: `Upload digital copies of required documents in PDF, JPG, PNG, or DOC format (max 10 MB each).` },
                  { step: 7, title: "Submit Application", desc: "Review your application summary and click Submit. A reference number will be generated for tracking." },
                  { step: 8, title: "MSWD Staff Reviews Application", desc: "Staff reviews your submitted application and documents. You will be notified of the status update via SMS." },
                ].map(({ step, title, desc }) => (
                  <div key={step} className="flex items-start gap-4">
                    <div className="size-7 rounded-full bg-blue-700 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">{step}</div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{title}</p>
                      <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
                <div className="mt-4 pt-3 border-t border-blue-200">
                  <p className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-2">Application Statuses</p>
                  <div className="flex flex-wrap gap-2">
                    {["Pending Verification", "Approved", "For Revision", "Rejected"].map(s => (
                      <span key={s} className="text-xs px-2.5 py-1 rounded-full bg-white border border-blue-300 text-blue-800 font-medium">{s}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* FAQ */}
            {detail.faq.length > 0 && (
              <div>
                <h2 className="text-base font-bold text-blue-900 mb-4" style={{ fontFamily: "'Libre Franklin', sans-serif" }}>
                  Frequently Asked Questions
                </h2>
                <div className="space-y-2">
                  {detail.faq.map((faq, i) => (
                    <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
                      <button
                        onClick={() => setOpenFaq(openFaq === i ? null : i)}
                        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                      >
                        <span className="text-sm font-semibold text-gray-900 pr-4">{faq.q}</span>
                        <ChevronDown className={`size-4 text-gray-400 flex-shrink-0 transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                      </button>
                      {openFaq === i && (
                        <div className="px-4 pb-4 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3">{faq.a}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Apply CTA */}
            <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm">
              <div className={`${cat.bgColor} px-5 py-4`}>
                <h3 className="font-bold text-white text-sm" style={{ fontFamily: "'Libre Franklin', sans-serif" }}>
                  Apply for {svc.title}
                </h3>
                <p className="text-white/80 text-xs mt-0.5">Two ways to apply</p>
              </div>
              <div className="bg-white p-5 space-y-3">
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="text-xs font-bold text-amber-800 mb-1 flex items-center gap-1.5">
                    <MapPin className="size-3.5" /> Walk-in
                  </p>
                  <p className="text-xs text-amber-700">Visit the MSWD Office with your documents. Mon–Fri, 8:00 AM – 5:00 PM.</p>
                </div>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                  <p className="text-xs font-bold text-blue-800 mb-1 flex items-center gap-1.5">
                    <Globe className="size-3.5" /> Online (Beneficiary Portal)
                  </p>
                  <p className="text-xs text-blue-700">Login to the Beneficiary Portal and use Apply for Service to submit your application.</p>
                </div>
                <button
                  onClick={onLogin}
                  className={`w-full py-2.5 ${cat.bgColor} text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity`}
                >
                  Login to Apply Online
                </button>
                <button
                  onClick={() => onNav({ page: "about" })}
                  className="w-full py-2.5 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  Contact MSWD Office
                </button>
              </div>
            </div>

            {/* Office Info */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3
                className="font-bold text-gray-900 mb-3 text-sm"
                style={{ fontFamily: "'Libre Franklin', sans-serif" }}
              >
                MSWD Office
              </h3>
              <ul className="space-y-2.5 text-xs text-gray-600">
                <li className="flex items-start gap-2">
                  <MapPin className="size-3.5 text-blue-600 mt-0.5 flex-shrink-0" />
                  Municipal Hall Complex, Calabanga, Camarines Sur 4405
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="size-3.5 text-blue-600 flex-shrink-0" />
                  (054) 871-1234
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="size-3.5 text-blue-600 flex-shrink-0" />
                  mswd.calabanga@gmail.com
                </li>
                <li className="flex items-start gap-2">
                  <Clock className="size-3.5 text-blue-600 mt-0.5 flex-shrink-0" />
                  Mon–Fri, 8:00 AM – 5:00 PM
                </li>
              </ul>
            </div>

            {/* Related services */}
            {cat.services.filter(s => s.id !== serviceId).length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3
                  className="font-bold text-gray-900 mb-3 text-sm"
                  style={{ fontFamily: "'Libre Franklin', sans-serif" }}
                >
                  Other {cat.title} Services
                </h3>
                <ul className="space-y-2">
                  {cat.services
                    .filter(s => s.id !== serviceId)
                    .slice(0, 5)
                    .map(s => (
                      <li key={s.id}>
                        <button
                          onClick={() =>
                            onNav({
                              page: "service-detail",
                              service: s.id,
                              category: cat.id,
                            })
                          }
                          className={`w-full text-left text-xs ${cat.textColor} hover:underline flex items-center gap-1`}
                        >
                          <ChevronRight className="size-3 flex-shrink-0" />
                          {s.title}
                        </button>
                      </li>
                    ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN EXPORT ─────────────────────────────────────────────

export function PublicWebsite({
  onNavigateToLogin,
  onNavigateToRegister,
}: {
  onNavigateToLogin: () => void;
  onNavigateToRegister: () => void;
}) {
  const [nav, setNav] = useState<NavState>({ page: "home" });

  function navigate(state: NavState) {
    setNav(state);
    setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 0);
  }

  return (
    <div
      className="min-h-screen bg-white"
      style={{ fontFamily: "'Source Sans 3', system-ui, sans-serif" }}
    >
      <TopNav nav={nav} onNav={navigate} onLogin={onNavigateToLogin} onRegister={onNavigateToRegister} />
      <main>
        {nav.page === "home" && (
          <HomePage onNav={navigate} onLogin={onNavigateToLogin} onRegister={onNavigateToRegister} />
        )}
        {nav.page === "about" && <AboutPage onNav={navigate} />}
        {nav.page === "services" && <ServicesOverview onNav={navigate} />}
        {nav.page === "category" && nav.category && (
          <CategoryDashboard categoryId={nav.category} onNav={navigate} />
        )}
        {nav.page === "service-detail" && nav.service && (
          <ServiceDetail
            serviceId={nav.service}
            categoryId={nav.category}
            onNav={navigate}
            onLogin={onNavigateToLogin}
          />
        )}
      </main>
      <Footer onNav={navigate} onLogin={onNavigateToLogin} />
    </div>
  );
}
