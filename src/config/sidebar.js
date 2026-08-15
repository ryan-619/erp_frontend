// ====================================================================
// Sidebar Menu Configuration
//
// Purpose:
// Single source of truth for the sidebar navigation tree. The Sidebar
// component renders dynamically from this array — adding a new module is
// just appending a new section here, with no changes needed in Sidebar.jsx.
//
// Structure:
//   Each item is { id, title, icon, path?, children? }.
//   - Top-level items with `path` are direct links (no expand/collapse).
//   - Top-level items with `children` become collapsible dropdowns.
//   - Icons are lucide-react components referenced by reference (not string names)
//     so the bundler can tree-shake unused icons.
//
// Consumed by:
//   - Sidebar.jsx (renders the menu)
//   - Route guards (path matching for active-link highlighting)
// ====================================================================

// Configuration-based sidebar. The Sidebar component renders dynamically from this file.
// To add a new module, append a new section here — no changes needed in Sidebar.jsx.
//
// Shape:
//   { id, title, icon, path?, children?: [{ title, path }] }
// - Top-level items with `path` are direct links (no expand/collapse).
// - Top-level items with `children` become collapsible dropdowns.

import { LayoutDashboard, 
  Users, 
  GraduationCap, 
  ClipboardList,
   SquareUser as 
   UserSquare, 
   BookOpen, 
   Layers, 
   Library, 
   CalendarClock, 
   CalendarCheck, 
   ClipboardCheck, 
   CalendarDays, 
   FileText, 
   CalendarRange, 
   Award, 
   IdCard, 
   Printer, 
   FileBadge, 
   ScrollText, 
   ChartBar as BarChart3, 
   IndianRupee, 
   School, 
   Building2, 
   Globe, 
   ShieldCheck, 
   Crown, 
   Settings, 
   Briefcase, 
   UsersRound, 
   Star, 
   Wallet, 
   CalendarX, 
   CalendarPlus, 
   Tags, 
   Ban, 
   ConciergeBell, 
   DoorOpen, 
   PhoneCall, 
   Send, 
   Inbox, 
   MessageSquare, 
   Library as LibraryIcon, 
   BookPlus, 
   ArrowLeftRight, 
   UserCog, 
   Bus, 
   Route as RouteIcon, 
   MapPin, 
   UserPlus, 
   DollarSign, 
   ChartBar as FileBarChart, 
   BedDouble, 
   Building2 as BuildingIcon, 
   DoorOpen as DoorOpenIcon, 
   GraduationCap as GraduationCapIcon, 
   CalendarDays as CalendarDaysIcon, 
   Download as DownloadIcon, 
   Video as VideoIcon, 
   TrendingUp, 
   TrendingDown, 
   ClipboardList as ClipboardListIcon, 
   Package, 
   MonitorPlay, 
   LayoutTemplate, 
   Image as ImageIcon, 
   Newspaper, 
   CalendarDays as EventIcon, 
   Images, 
   FolderOpen, 
   FileText as PageIcon, 
   Menu as MenuIcon, 
   Bell, 
   MessageSquare as SmsIcon, 
   CreditCard, 
   Languages, 
   Shield as CaptchaIcon, 
   Boxes, 
   Globe as FrontCmsIcon, 
   Boxes as CustomFieldIcon, 
   FileCog, 
   FileType 
} from 'lucide-react'

export const sidebarItems = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    icon: LayoutDashboard,
    path: '/dashboard',
  },
  {
    id: 'my-profile',
    title: 'My Profile',
    icon: UserSquare,
    path: '/my-profile',
    roles: ['student'],
  },
  {
    id: 'students',
    title: 'Student Information',
    icon: Users,
    roles: ['superadmin', 'admin', 'staff'],
    children: [
      { title: 'Student List', path: '/students' },
      { title: 'Student Admission', path: '/students/admissions' },
      { title: 'Student Categories', path: '/students/categories' },
      { title: 'Student House', path: '/students/houses' },
      { title: 'Disabled Students', path: '/students/disabled' },
      {
        title: 'Disable Reasons',
        path: '/students/disable-reasons',
      },

      {
        title: 'Multi Class Students',
        path: '/students/multi-class',
      },



      {
        title: 'Bulk Delete',
        path: '/students/bulk-delete',
      },
    ],
  },
  {
    id: 'academics',
    title: 'Academics',
    icon: BookOpen,
    children: [
      { title: 'Classes', path: '/academics/classes', roles: ['superadmin', 'admin', 'staff'] },
      { title: 'Sections', path: '/academics/sections', roles: ['superadmin', 'admin', 'staff'] },
      { title: 'Subjects', path: '/academics/subjects', roles: ['superadmin', 'admin', 'staff'] },
      { title: 'Subject Groups', path: '/academics/subject-groups', roles: ['superadmin', 'admin', 'staff'] },
      { title: 'Class Timetable', path: '/academics/timetable' },
      { title: 'Teachers Timetable', path: '/academics/teachers-timetable' },
      { title: 'Assign Class Teacher', path: '/academics/assign-class-teacher', roles: ['superadmin', 'admin', 'staff'] },
      { title: 'Promote Students', path: '/academics/promote-students', roles: ['superadmin', 'admin', 'staff'] },
    ],
  },
  {
    id: 'attendance',
    title: 'Attendance',
    icon: ClipboardCheck,
    children: [
      { title: 'My Attendance', path: '/attendance/my-attendance', roles: ['student'] },
      { title: 'Student Attendance', path: '/attendance', roles: ['superadmin', 'admin', 'staff'] },
      { title: 'Apply Leave', path: '/attendance/apply-leave' },
      { title: 'My Leave Requests', path: '/attendance/my-leave-requests', roles: ['student'] },
      { title: 'Approve Leave', path: '/attendance/approve-leave', roles: ['admin', 'staff', 'superadmin'] },
      { title: 'Attendance By Date', path: '/attendance/by-date', roles: ['admin', 'staff', 'superadmin'] },
    ],
  },
  {
    id: 'examinations',
    title: 'Examinations',
    icon: FileText,
    children: [
      { title: 'Exam Group', path: '/examinations/exam-groups', roles: ['superadmin', 'admin', 'staff'] },
      { title: 'Exam Schedule', path: '/examinations/schedule' },
      { title: 'My Results', path: '/examinations/my-results', roles: ['student'] },
      { title: 'Exam Result', path: '/examinations/results', roles: ['superadmin', 'admin', 'staff'] },
      { title: 'My Marksheet', path: '/examinations/my-marksheet', roles: ['student'] },
      { title: 'Design Admit Card', path: '/examinations/design-admit-card', roles: ['superadmin', 'admin', 'staff'] },
      { title: 'My Admit Card', path: '/examinations/my-admit-card', roles: ['student'] },
      { title: 'Print Admit Card', path: '/examinations/print-admit-card', roles: ['superadmin', 'admin', 'staff'] },
      { title: 'Design Marksheet', path: '/examinations/design-marksheet', roles: ['superadmin', 'admin', 'staff'] },
      { title: 'Print Marksheet', path: '/examinations/print-marksheet', roles: ['superadmin', 'admin', 'staff'] },
      { title: 'Marks Grade', path: '/examinations/marks-grade', roles: ['superadmin', 'admin', 'staff'] },
      { title: 'Marks Division', path: '/examinations/marks-division', roles: ['superadmin', 'admin', 'staff'] },
    ],
  },
  {
    id: 'fees',
    title: 'Fees Collection',
    icon: IndianRupee,
    children: [
      { title: 'Due Fees', path: '/fees/due-fees', roles: ['student'] },
      { title: 'Payment History', path: '/fees/payment-history', roles: ['student'] },
      { title: 'Collect Fees', path: '/fees/collect', roles: ['superadmin', 'admin', 'staff'] },
      { title: 'Search Fees Payment', path: '/fees/search-payment', roles: ['superadmin', 'admin', 'staff'] },
      { title: 'Search Due Fees', path: '/fees/search-due', roles: ['superadmin', 'admin', 'staff'] },
      { title: 'Offline Bank Payment', path: '/fees/offline-payment', roles: ['superadmin', 'admin', 'staff'] },
      { title: 'Fee Reminder', path: '/fees/reminder', roles: ['superadmin', 'admin', 'staff'] },
      { title: 'Fees Master', path: '/fees/master', roles: ['superadmin', 'admin', 'staff'] },
      { title: 'Fees Group', path: '/fees/group', roles: ['superadmin', 'admin', 'staff'] },
      { title: 'Fees Type', path: '/fees/type', roles: ['superadmin', 'admin', 'staff'] },
      { title: 'Fees Discount', path: '/fees/discount', roles: ['superadmin', 'admin', 'staff'] },
      { title: 'Fees Carry Forward', path: '/fees/carry-forward', roles: ['superadmin', 'admin', 'staff'] },
    ],
  },
  {
    id: 'hr',
    title: 'Human Resources',
    icon: UsersRound,
    roles: ['superadmin', 'admin', 'staff'],
    children: [
      { title: 'Staff Directory', path: '/hr/staff' },
      { title: 'Staff Attendance', path: '/hr/attendance' },
      { title: 'Payroll', path: '/hr/payroll' },
      { title: 'Approve Leave', path: '/hr/approve-leave', roles: ['admin', 'superadmin'] },
      { title: 'Apply Leave', path: '/hr/apply-leave' },
      { title: 'Leave Types', path: '/hr/leave-types' },
      { title: 'Teachers Rating', path: '/hr/teachers-rating' },
      { title: 'Department', path: '/hr/departments' },
      { title: 'Designation', path: '/hr/designations' },
      { title: 'Disabled Staff', path: '/hr/disabled-staff' },
    ],
  },
  {
    id: 'front-office',
    title: 'Front Office',
    icon: ConciergeBell,
    roles: ['superadmin', 'admin', 'staff'],
    children: [
      { title: 'Admission Enquiry', path: '/front-office/enquiry' },
      { title: 'Visitor Book', path: '/front-office/visitor-book' },
      { title: 'Phone Call Log', path: '/front-office/call-log' },
      { title: 'Postal Dispatch', path: '/front-office/dispatch' },
      { title: 'Postal Receive', path: '/front-office/receive' },
      { title: 'Complaint', path: '/front-office/complaint' },
      { title: 'Setup Front Office', path: '/front-office/setup' },
    ],
  },
  {
    id: 'library',
    title: 'Library',
    icon: LibraryIcon,
    children: [
      { title: 'Books', path: '/library/books', roles: ['student'] },
      { title: 'My Library', path: '/library/my-library', roles: ['student'] },
      { title: 'Book List', path: '/library/books', roles: ['superadmin', 'admin', 'staff'] },
      { title: 'Issue / Return', path: '/library/issue-return', roles: ['superadmin', 'admin', 'staff'] },
      { title: 'Add Book', path: '/library/add-book', roles: ['superadmin', 'admin', 'staff'] },
      { title: 'Library Staff', path: '/library/staff', roles: ['superadmin', 'admin', 'staff'] },
      { title: 'Library Students', path: '/library/students', roles: ['superadmin', 'admin', 'staff'] },
    ],
  },
  {
    id: 'transport',
    title: 'Transport',
    icon: Bus,
    children: [
      { title: 'My Transport', path: '/transport/my-transport', roles: ['student'] },
      { title: 'Routes', path: '/transport/routes', roles: ['superadmin', 'admin', 'staff'] },
      { title: 'Vehicles', path: '/transport/vehicles', roles: ['superadmin', 'admin', 'staff'] },
      { title: 'Pickup Points', path: '/transport/pickup-points', roles: ['superadmin', 'admin', 'staff'] },
      { title: 'Assign Vehicle', path: '/transport/assign-vehicle', roles: ['superadmin', 'admin', 'staff'] },
      { title: 'Assign Pickup Point', path: '/transport/assign-pickup-point', roles: ['superadmin', 'admin', 'staff'] },
      { title: 'Transport Fees', path: '/transport/fees', roles: ['superadmin', 'admin', 'staff'] },
      { title: 'Student Transport Fees', path: '/transport/student-fees', roles: ['superadmin', 'admin', 'staff'] },
    ],
  },
  {
    id: 'hostel',
    title: 'Hostel',
    icon: BedDouble,
    children: [
      { title: 'Hostels', path: '/hostel/hostels' },
      { title: 'Room Types', path: '/hostel/room-types' },
      { title: 'Hostel Rooms', path: '/hostel/rooms' },
    ],
  },
  {
    id: 'income',
    title: 'Income',
    icon: TrendingUp,
    roles: ['superadmin', 'admin', 'staff'],
    children: [
      { title: 'Income Head', path: '/income/head' },
      { title: 'Add Income', path: '/income/add' },
      { title: 'Search Income', path: '/income/search' },
    ],
  },
  {
    id: 'expenses',
    title: 'Expenses',
    icon: TrendingDown,
    children: [
      { title: 'Expense Head', path: '/expenses/head' },
      { title: 'Add Expense', path: '/expenses/add' },
      { title: 'Search Expense', path: '/expenses/search' },
    ],
  },
  {
    id: 'homework',
    title: 'Homework',
    icon: ClipboardListIcon,
    children: [
      { title: 'Add Homework', path: '/homework/add', roles: ['superadmin', 'admin', 'staff'] },
      { title: 'My Homework', path: '/homework/my-homework', roles: ['student'] },
      { title: 'Daily Assignment', path: '/homework/daily-assignment' },
    ],
  },
  {
    id: 'lesson-plan',
    title: 'Lesson Plan',
    icon: BookOpen,
    roles: ['superadmin', 'admin', 'staff', 'student'],
    children: [
      { title: 'Lessons', path: '/lesson-plan/lessons', roles: ['superadmin', 'admin', 'staff'] },
      { title: 'Topics', path: '/lesson-plan/topics', roles: ['superadmin', 'admin', 'staff'] },
      { title: 'Lesson Plans', path: '/lesson-plan/lesson-plans', roles: ['superadmin', 'admin', 'staff'] },
      { title: 'My Lessons', path: '/lesson-plan/my-lessons', roles: ['student'] },
      { title: 'My Topics', path: '/lesson-plan/my-topics', roles: ['student'] },
      { title: 'My Lesson Plans', path: '/lesson-plan/my-lesson-plans', roles: ['student'] },
    ],
  },
  {
    id: 'alumni',
    title: 'Alumni',
    icon: GraduationCapIcon,
    children: [
      { title: 'Manage Alumni', path: '/alumni' },
      { title: 'Alumni Events', path: '/alumni/events' },
    ],
  },
  {
    id: 'download-center',
    title: 'Download Center',
    icon: DownloadIcon,
    children: [
      { title: 'Content Types', path: '/download-center/content-types', roles: ['superadmin', 'admin', 'staff'] },
      { title: 'Upload / Share Content', path: '/download-center/contents', roles: ['superadmin', 'admin', 'staff'] },
      { title: 'Shared Content', path: '/download-center/shared-content', roles: ['student'] },
      { title: 'Content Share List', path: '/download-center/share-list' },
      { title: 'Video Tutorials', path: '/download-center/video-tutorials' },
    ],
  },
  {
    id: 'inventory',
    title: 'Inventory',
    icon: Package,
    children: [
      { title: 'Item Category', path: '/inventory/categories' },
      { title: 'Item Store', path: '/inventory/stores' },
      { title: 'Item Supplier', path: '/inventory/suppliers' },
      { title: 'Items', path: '/inventory/items' },
      { title: 'Item Stock', path: '/inventory/stock' },
      { title: 'Issue Item', path: '/inventory/issue' },
    ],
  },
  {
    id: 'online-exam',
    title: 'Online Examination',
    icon: MonitorPlay,
    roles: ['superadmin', 'admin', 'staff', 'student'],
    children: [
      { title: 'Online Exams', path: '/online-exam', roles: ['superadmin', 'admin', 'staff'] },
      { title: 'Question Bank', path: '/online-exam/question-bank', roles: ['superadmin', 'admin', 'staff'] },
      { title: 'My Online Exams', path: '/online-exam/my-exams', roles: ['student'] },
    ],
  },
  {
    id: 'certificate',
    title: 'Certificate',
    icon: Award,
    children: [
      { title: 'My Certificates', path: '/certificate/my-certificates', roles: ['student'] },
      { title: 'My ID Card', path: '/certificate/my-id-card', roles: ['student'] },
      { title: 'Student Certificate', path: '/certificate/student', roles: ['superadmin', 'admin', 'staff'] },
      { title: 'Generate Certificate', path: '/certificate/generate', roles: ['superadmin', 'admin', 'staff'] },
      { title: 'Student ID Card', path: '/certificate/student-id-card', roles: ['superadmin', 'admin', 'staff'] },
      { title: 'Generate Student ID', path: '/certificate/generate-id-card', roles: ['superadmin', 'admin', 'staff'] },
      { title: 'Staff ID Card', path: '/certificate/staff-id-card', roles: ['superadmin', 'admin', 'staff'] },
      { title: 'Generate Staff ID', path: '/certificate/generate-staff-id-card', roles: ['superadmin', 'admin', 'staff'] },
    ],
  },
  {
    id: 'front-cms',
    title: 'Front CMS',
    icon: LayoutTemplate,
    children: [
      { title: 'Banners', path: '/front-cms/banners' },
      { title: 'News', path: '/front-cms/news' },
      { title: 'Events', path: '/front-cms/events' },
      { title: 'Gallery', path: '/front-cms/gallery' },
      { title: 'Media Manager', path: '/front-cms/media' },
      { title: 'Pages', path: '/front-cms/pages' },
      { title: 'Menus', path: '/front-cms/menus' },
    ],
  },
  {
    id: 'settings-module',
    title: 'Settings',
    icon: Settings,
    children: [
      { title: 'Dashboard', path: '/settings/dashboard' },
      { title: 'General', path: '/settings/general' },
      { title: 'Session', path: '/settings/session' },
      { title: 'Roles & Permissions', path: '/settings/roles' },
      { title: 'Users', path: '/settings/users' },
      { title: 'Notifications', path: '/settings/notifications' },
      { title: 'SMS', path: '/settings/sms' },
      { title: 'Payment', path: '/settings/payment' },
      { title: 'Currency', path: '/settings/currency' },
      { title: 'Language', path: '/settings/language' },
      { title: 'Captcha', path: '/settings/captcha' },
      { title: 'Modules', path: '/settings/modules' },
      { title: 'Front CMS', path: '/settings/front-cms' },
      { title: 'Custom Fields', path: '/settings/custom-fields' },
      { title: 'System Fields', path: '/settings/system-fields' },
      { title: 'File Types', path: '/settings/file-types' },
    ],
  },
  {
    id: 'institution',
    title: 'Institution Management',
    icon: School,
    children: [
      { title: 'Schools', path: '/schools' },
      { title: 'Colleges', path: '/colleges' },
      { title: 'Domains', path: '/domains' },
    ],
  },
  {
    id: 'users',
    title: 'User Management',
    icon: ShieldCheck,
    children: [
      { title: 'Users', path: '/users' },
      { title: 'Roles', path: '/users/roles' },
    ],
  },
  {
    id: 'notifications',
    title: 'Notifications',
    icon: Bell,
    path: '/notifications',
    roles: ['student'],
  },
  {
    id: 'administration',
    title: 'Administration',
    icon: Crown,
    children: [
      { title: 'Super Admin', path: '/super-admin' },
      { title: 'Settings', path: '/settings' },
    ],
  },
]

export default sidebarItems
