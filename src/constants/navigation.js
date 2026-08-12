// ====================================================================
// Navigation + Domain Constants
//
// Purpose:
// The canonical source of truth for the app's navigation structure and
// the domain enums (roles, statuses) shared with the backend.
//
// Contents:
//   - NAV_GROUPS — the sidebar menu tree, grouped by domain. Each item maps
//     a title + lucide icon to a route path.
//   - APP_NAME / APP_VERSION — branding constants.
//   - STORAGE_KEYS — localStorage keys (namespaced to avoid collisions).
//   - USER_ROLES / ROLE_LABELS — role enum matching the backend's
//     centralModels.js + users.controller.js.
//   - STATUS_OPTIONS / STATUS_STYLES — status enum + Tailwind class map
//     used by StatusBadge.
//   - LEAVE_STATUS_OPTIONS — leave request workflow states.
//
// Why a single file:
//   Keeping navigation + domain enums together means adding a new module
//   is a one-file change: add the nav group here, then create the route.
// ====================================================================

// Navigation + domain constants aligned with School_erp-b-main backend modules.

export const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [
      { title: 'Dashboard', to: '/dashboard', icon: 'LayoutDashboard' },
    ],
  },
  {
    label: 'Institution Management',
    items: [
      { title: 'Schools', to: '/schools', icon: 'School' },
      { title: 'Colleges', to: '/colleges', icon: 'Building2' },
      { title: 'Domains', to: '/domains', icon: 'Globe' },
    ],
  },
  {
    label: 'Student Management',
    items: [
      { title: 'Students', to: '/students', icon: 'GraduationCap' },
      { title: 'Admissions', to: '/students/admissions', icon: 'ClipboardList' },
      { title: 'Multi Class Students', to: '/students/multi-class', icon: 'Users' },
      
    ],
  },
  {
    label: 'Academics',
    items: [
      { title: 'Classes', to: '/academics/classes', icon: 'BookOpen' },
      { title: 'Sections', to: '/academics/sections', icon: 'Layers' },
      { title: 'Subjects', to: '/academics/subjects', icon: 'Library' },
      { title: 'Timetable', to: '/academics/timetable', icon: 'CalendarClock' },
    ],
  },
  {
    label: 'Attendance',
    items: [
      { title: 'Student Attendance', to: '/attendance', icon: 'ClipboardCheck' },
      { title: 'Approve Leave', to: '/attendance/approve-leave', icon: 'CalendarCheck' },
      { title: 'Attendance By Date', to: '/attendance/by-date', icon: 'CalendarDays' },
    ],
  },
  {
    label: 'User Management',
    items: [
      { title: 'Users', to: '/users', icon: 'Users' },
      { title: 'Roles', to: '/users/roles', icon: 'ShieldCheck' },
    ],
  },
  {
    label: 'Administration',
    items: [
      { title: 'Super Admin', to: '/super-admin', icon: 'Crown' },
      { title: 'Settings', to: '/settings', icon: 'Settings' },
    ],
  },
  {
    label: 'Front Office',
    items: [
      { title: 'Admission Enquiry', to: '/front-office/enquiry', icon: 'ClipboardList' },
      { title: 'Visitor Book', to: '/front-office/visitor-book', icon: 'DoorOpen' },
      { title: 'Phone Call Log', to: '/front-office/call-log', icon: 'PhoneCall' },
      { title: 'Postal Dispatch', to: '/front-office/dispatch', icon: 'Send' },
      { title: 'Postal Receive', to: '/front-office/receive', icon: 'Inbox' },
      { title: 'Complaint', to: '/front-office/complaint', icon: 'MessageSquare' },
      { title: 'Setup Front Office', to: '/front-office/setup', icon: 'Settings' },
    ],
  },
  {
    label: 'Library',
    items: [
      { title: 'Book List', to: '/library/books', icon: 'Library' },
      { title: 'Issue / Return', to: '/library/issue-return', icon: 'ArrowLeftRight' },
      { title: 'Add Book', to: '/library/add-book', icon: 'BookPlus' },
      { title: 'Library Staff', to: '/library/staff', icon: 'UserCog' },
    ],
  },
  {
    label: 'Transport',
    items: [
      { title: 'Dashboard', to: '/transport', icon: 'Bus' },
      { title: 'Routes', to: '/transport/routes', icon: 'Route' },
      { title: 'Vehicles', to: '/transport/vehicles', icon: 'Bus' },
      { title: 'Pickup Points', to: '/transport/pickup-points', icon: 'MapPin' },
      { title: 'Assign Vehicle', to: '/transport/assign-vehicle', icon: 'UserPlus' },
      { title: 'Assign Pickup Point', to: '/transport/assign-pickup-point', icon: 'MapPin' },
      { title: 'Transport Fees', to: '/transport/fees', icon: 'DollarSign' },
      { title: 'Reports', to: '/transport/reports', icon: 'FileBarChart' },
    ],
  },
  {
    label: 'Hostel',
    items: [
      { title: 'Dashboard', to: '/hostel', icon: 'BedDouble' },
      { title: 'Hostel Rooms', to: '/hostel/rooms', icon: 'BedDouble' },
      { title: 'Room Types', to: '/hostel/room-types', icon: 'Building2' },
      { title: 'Room Allocation', to: '/hostel/allocation', icon: 'DoorOpen' },
      { title: 'Student Hostel List', to: '/hostel/students', icon: 'Users' },
      { title: 'Hostel Fees', to: '/hostel/fees', icon: 'DollarSign' },
      { title: 'Reports', to: '/hostel/reports', icon: 'FileBarChart' },
    ],
  },
]

export const APP_NAME = 'School-ERP'
export const APP_VERSION = '1.0.0'

export const STORAGE_KEYS = {
  AUTH: 'scholaria.auth',
  TENANT: 'scholaria.tenant',
  THEME: 'scholaria.theme',
}

// Roles as defined in the backend (centralModels.js + users.controller.js).
export const USER_ROLES = {
  SUPER_ADMIN: 'superadmin',
  ADMIN: 'admin',
  STAFF: 'staff',
  STUDENT: 'student',
  PARENT: 'parent',
}

export const ROLE_LABELS = {
  superadmin: 'Super Admin',
  admin: 'Administrator',
  staff: 'Staff',
  student: 'Student',
  parent: 'Parent',
}

// Role-based dashboard routes after login.
export const ROLE_DASHBOARD = {
  superadmin: '/dashboard',
  admin: '/admin/dashboard',
  staff: '/staff/dashboard',
  student: '/student/dashboard',
  parent: '/parent/dashboard',
}

// Login endpoints per role (matches backend routes).
export const AUTH_ENDPOINTS = {
  superadmin: { login: '/auth/login', signup: '/auth/signup', logout: '/auth/logout' },
  admin: { login: '/users/admin/login', signup: '/users/admin/signup', logout: '/users/admin/login' },
  staff: { login: '/users/staff/login', signup: '/users/staff/signup', logout: '/users/staff/login' },
  student: { login: '/users/student/login', signup: '/users/student/signup', logout: '/users/student/login' },
  parent: { login: '/users/parent/login', signup: '/users/parent/signup', logout: '/users/parent/login' },
}

// Signup field configuration per role — derived from backend controller validation.
// Each field: { name, label, type, required, placeholder }
export const SIGNUP_FIELDS = {
  superadmin: [
    { name: 'name', label: 'Full Name', type: 'text', required: true, placeholder: 'John Doe' },
    { name: 'email', label: 'Email', type: 'email', required: true, placeholder: 'you@institution.edu' },
    { name: 'password', label: 'Password', type: 'password', required: true, placeholder: '••••••••' },
  ],
  admin: [
    { name: 'name', label: 'Full Name', type: 'text', required: true, placeholder: 'John Doe' },
    { name: 'email', label: 'Email', type: 'email', required: true, placeholder: 'admin@school.edu' },
    { name: 'password', label: 'Password', type: 'password', required: true, placeholder: '••••••••' },
    { name: 'phone', label: 'Phone', type: 'tel', required: false, placeholder: '+1 555-0100' },
  ],
  staff: [
    { name: 'name', label: 'Full Name', type: 'text', required: true, placeholder: 'Jane Smith' },
    { name: 'email', label: 'Email', type: 'email', required: true, placeholder: 'staff@school.edu' },
    { name: 'password', label: 'Password', type: 'password', required: true, placeholder: '••••••••' },
    { name: 'phone', label: 'Phone', type: 'tel', required: false, placeholder: '+1 555-0100' },
  ],
  student: [
    { name: 'first_name', label: 'First Name', type: 'text', required: true, placeholder: 'Aarav' },
    { name: 'last_name', label: 'Last Name', type: 'text', required: false, placeholder: 'Sharma' },
    { name: 'email', label: 'Email', type: 'email', required: true, placeholder: 'student@school.edu' },
    { name: 'password', label: 'Password', type: 'password', required: true, placeholder: '••••••••' },
    { name: 'phone', label: 'Phone', type: 'tel', required: false, placeholder: '+1 555-0100' },
  ],
  parent: [
    { name: 'name', label: 'Full Name', type: 'text', required: true, placeholder: 'Parent Name' },
    { name: 'email', label: 'Email', type: 'email', required: true, placeholder: 'parent@email.com' },
    { name: 'password', label: 'Password', type: 'password', required: true, placeholder: '••••••••' },
  ],
}

// Sidebar menu visibility per role.
export const ROLE_SIDEBAR = {
  superadmin: ['dashboard', 'institution', 'academics', 'attendance', 'hr', 'settings-module', 'users', 'administration'],
  admin: ['dashboard', 'students', 'academics', 'attendance', 'fees', 'hr', 'examinations', 'library', 'transport', 'hostel', 'front-office', 'homework', 'lesson-plan', 'income', 'expenses', 'inventory', 'online-exam', 'certificate', 'alumni', 'download-center', 'front-cms', 'settings-module'],
  staff: ['dashboard', 'attendance', 'homework', 'academics', 'examinations', 'online-exam', 'lesson-plan', 'library'],
  student: ['dashboard', 'attendance', 'homework', 'examinations', 'online-exam', 'fees', 'library', 'transport', 'hostel'],
  parent: ['dashboard', 'students', 'attendance', 'fees', 'examinations', 'transport', 'hostel'],
}

// Status enum matches centralModels.js / hrModel.js.
export const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'suspended', label: 'Suspended' },
]

export const STATUS_STYLES = {
  active: 'bg-success/10 text-success border-success/20',
  inactive: 'bg-muted text-muted-foreground border-border',
  pending: 'bg-warning/10 text-warning border-warning/20',
  suspended: 'bg-destructive/10 text-destructive border-destructive/20',
  disabled: 'bg-destructive/10 text-destructive border-destructive/20',
}

// Leave request status (hrModel.js applyLeaveSchema).
export const LEAVE_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
]
