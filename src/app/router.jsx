// ====================================================================
// App Router — Route Configuration
//
// Purpose:
// Central declaration of every route in the application and the guards
// that protect them.
//
// Route groups:
//   1. Public routes — /login (wrapped in PublicRoute + AuthLayout).
//      Authenticated users are redirected away from these.
//   2. Protected routes — all module pages (wrapped in ProtectedRoute +
//      AppLayout). Unauthenticated users are redirected to /login.
//   3. Error routes — /403, /404, and the catch-all "*" fallback.
//
// Authentication flow:
//   ProtectedRoute checks `isAuthenticated` from AuthContext; if false it
//   redirects to /login preserving the intended location for post-login
//   redirect. PublicRoute does the inverse for auth pages.
//
// Lazy loading strategy:
//   Every page component is lazy()-imported so Vite splits each route into
//   its own chunk. The <Suspense> wrapper shows <PageLoader /> while the
//   chunk downloads, keeping the initial bundle small.
// ====================================================================

import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from '@/layouts/AppLayout'
import AuthLayout from '@/layouts/AuthLayout'
import ProtectedRoute from '@/routes/ProtectedRoute'
import PublicRoute from '@/routes/PublicRoute'
import PageLoader from '@/components/loaders/PageLoader'
import { useAuth } from '@/context/AuthContext'


const LoginPage = lazy(() => import('@/pages/auth/LoginPage'))
const SignupPage = lazy(() => import('@/pages/auth/SignupPage'))
const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage'))
const StudentDashboardPage = lazy(() => import('@/pages/student/StudentDashboardPage'))
const SchoolsPage = lazy(() => import('@/pages/schools/SchoolsPage'))
const CollegesPage = lazy(() => import('@/pages/colleges/CollegesPage'))
const DomainsPage = lazy(() => import('@/pages/domains/DomainsPage'))
const StudentsPage = lazy(() => import('@/pages/students/StudentsPage'))
const StudentProfilePage = lazy(() => import('@/pages/students/StudentProfilePage'))
const AdmissionsPage = lazy(() => import('@/pages/students/AdmissionsPage'))
const StudentCategoriesPage = lazy(() => import('@/pages/students/StudentCategoriesPage'))
const StudentHousesPage = lazy(() => import('@/pages/students/StudentHousesPage'))
const DisabledStudentsPage = lazy(() => import('@/pages/students/DisabledStudentsPage'))
const ClassesPage = lazy(() => import('@/pages/academics/ClassesPage'))
const SectionsPage = lazy(() => import('@/pages/academics/SectionsPage'))
const SubjectsPage = lazy(() => import('@/pages/academics/SubjectsPage'))
const SubjectGroupsPage = lazy(() => import('@/pages/academics/SubjectGroupsPage'))
const AssignClassTeacherPage = lazy(() => import('@/pages/academics/AssignClassTeacherPage'))
const PromoteStudentsPage = lazy(() => import('@/pages/academics/PromoteStudentsPage'))
const ClassTimetablePage = lazy(() => import('@/pages/academics/ClassTimetablePage'))
const TeachersTimetablePage = lazy(() => import('@/pages/academics/TeachersTimetablePage'))
const StudentAttendancePage = lazy(() => import('@/pages/attendance/StudentAttendancePage'))
const ApproveLeavePage = lazy(() => import('@/pages/attendance/ApproveLeavePage'))
const StudentLeaveApplication = lazy(() => import('@/pages/attendance/StudentLeaveApplication'))
const AttendanceByDatePage = lazy(() => import('@/pages/attendance/AttendanceByDatePage'))
const ExamGroupsPage = lazy(() => import('@/pages/examinations/ExamGroupsPage'))
const ExamSchedulePage = lazy(() => import('@/pages/examinations/ExamSchedulePage'))
const ExamResultsPage = lazy(() => import('@/pages/examinations/ExamResultsPage'))
const DesignAdmitCardPage = lazy(() => import('@/pages/examinations/DesignAdmitCardPage'))
const PrintAdmitCardPage = lazy(() => import('@/pages/examinations/PrintAdmitCardPage'))
const DesignMarksheetPage = lazy(() => import('@/pages/examinations/DesignMarksheetPage'))
const PrintMarksheetPage = lazy(() => import('@/pages/examinations/PrintMarksheetPage'))
const MarksGradePage = lazy(() => import('@/pages/examinations/MarksGradePage'))
const MarksDivisionPage = lazy(() => import('@/pages/examinations/MarksDivisionPage'))
const UsersPage = lazy(() => import('@/pages/users/UsersPage'))
const RolesPage = lazy(() => import('@/pages/users/RolesPage'))
const SuperAdminPage = lazy(() => import('@/pages/super-admin/SuperAdminPage'))
const SettingsPage = lazy(() => import('@/pages/settings/SettingsPage'))
const ProfilePage = lazy(() => import('@/pages/profile/ProfilePage'))
const CollectFeesPage = lazy(() => import('@/pages/fees/CollectFees'))
const SearchFeesPaymentPage = lazy(() => import('@/pages/fees/SearchFeesPayment'))
const SearchDueFeesPage = lazy(() => import('@/pages/fees/SearchDueFees'))
const OfflineBankPaymentPage = lazy(() => import('@/pages/fees/OfflineBankPayment'))
const FeesReminderPage = lazy(() => import('@/pages/fees/FeesReminder'))
const FeesMasterPage = lazy(() => import('@/pages/fees/FeesMaster'))
const FeesGroupPage = lazy(() => import('@/pages/fees/FeesGroup'))
const FeesTypePage = lazy(() => import('@/pages/fees/FeesType'))
const FeesDiscountPage = lazy(() => import('@/pages/fees/FeesDiscount'))
const FeesCarryForwardPage = lazy(() => import('@/pages/fees/FeesCarryForward'))
const MultiClassStudentsPage = lazy(() => import('@/pages/students/MultiClassStudentsPage')) 

const DisableReasonsPage = lazy(() =>
  import('@/pages/students/DisableReasonsPage')
)


const BulkDeletePage = lazy(() =>
  import('@/pages/students/BulkDeletePage')
)






// HR module — lazy-loaded so the bundle only downloads when a user visits HR pages
const StaffDirectoryPage = lazy(() => import('@/pages/hr/StaffDirectoryPage'))
const StaffAttendancePage = lazy(() => import('@/pages/hr/StaffAttendancePage'))
const PayrollPage = lazy(() => import('@/pages/hr/PayrollPage'))
const ApproveLeaveHRPage = lazy(() => import('@/pages/hr/ApproveLeaveHRPage'))
const ApplyLeavePage = lazy(() => import('@/pages/hr/ApplyLeavePage'))
const LeaveTypesPage = lazy(() => import('@/pages/hr/LeaveTypesPage'))
const TeachersRatingPage = lazy(() => import('@/pages/hr/TeachersRatingPage'))
const DepartmentPage = lazy(() => import('@/pages/hr/DepartmentPage'))
const DesignationPage = lazy(() => import('@/pages/hr/DesignationPage'))
const DisabledStaffPage = lazy(() => import('@/pages/hr/DisabledStaffPage'))

// Front Office module — lazy-loaded so the bundle only downloads when a user visits Front Office pages
const AdmissionEnquiryPage = lazy(() => import('@/pages/front-office/AdmissionEnquiryPage'))
const VisitorBookPage = lazy(() => import('@/pages/front-office/VisitorBookPage'))
const PhoneCallLogPage = lazy(() => import('@/pages/front-office/PhoneCallLogPage'))
const PostalDispatchPage = lazy(() => import('@/pages/front-office/PostalDispatchPage'))
const PostalReceivePage = lazy(() => import('@/pages/front-office/PostalReceivePage'))
const ComplaintPage = lazy(() => import('@/pages/front-office/ComplaintPage'))
const SetupFrontOfficePage = lazy(() => import('@/pages/front-office/SetupFrontOfficePage'))

// Library module — lazy-loaded so the bundle only downloads when a user visits Library pages
const BookListPage = lazy(() => import('@/pages/library/BookListPage'))
const IssueReturnPage = lazy(() => import('@/pages/library/IssueReturnPage'))
const AddBookPage = lazy(() => import('@/pages/library/AddBookPage'))
const AddStaffMemberPage = lazy(() => import('@/pages/library/AddStaffMemberPage'))
const LibraryStudentPage = lazy(() => import('@/pages/library/LibraryStudentPage'))

// Transport module — lazy-loaded so the bundle only downloads when a user visits Transport pages

const RoutesPage = lazy(() => import('@/pages/transport/RoutesPage'))
const VehiclesPage = lazy(() => import('@/pages/transport/VehiclesPage'))
const PickupPointsPage = lazy(() => import('@/pages/transport/PickupPointsPage'))
const AssignVehiclePage = lazy(() => import('@/pages/transport/AssignVehiclePage'))
const AssignPickupPointPage = lazy(() => import('@/pages/transport/AssignPickupPointPage'))
const StudentTransportFeesPage = lazy(() => import('@/pages/transport/StudentTransportFeesPage'))
const TransportFeesPage = lazy(() => import('@/pages/transport/TransportFeesPage'))

// Hostel module — lazy-loaded so the bundle only downloads when a user visits Hostel pages
const HostelListPage = lazy(() => import('@/pages/hostel/HostelListPage'))
const HostelRoomsPage = lazy(() => import('@/pages/hostel/HostelRoomsPage'))
const RoomTypesPage = lazy(() => import('@/pages/hostel/RoomTypesPage'))

// Income module — lazy-loaded so the bundle only downloads when a user visits Income pages
const IncomeHeadPage = lazy(() => import('@/pages/income/IncomeHeadPage'))
const AddIncomePage = lazy(() => import('@/pages/income/AddIncomePage'))
const SearchIncomePage = lazy(() => import('@/pages/income/SearchIncomePage'))

// Expenses module — lazy-loaded so the bundle only downloads when a user visits Expenses pages
const ExpenseHeadPage = lazy(() => import('@/pages/expenses/ExpenseHeadPage'))
const AddExpensePage = lazy(() => import('@/pages/expenses/AddExpensePage'))
const SearchExpensePage = lazy(() => import('@/pages/expenses/SearchExpensePage'))

// Homework module — lazy-loaded so the bundle only downloads when a user visits Homework pages
const AddHomeworkPage = lazy(() => import('@/pages/homework/AddHomeworkPage'))
const DailyAssignmentPage = lazy(() => import('@/pages/homework/DailyAssignmentPage'))

// Lesson Plan module — lazy-loaded so the bundle only downloads when a user visits Lesson Plan pages
const LessonPage = lazy(() => import('@/pages/lesson-plan/LessonPage'))
const TopicPage = lazy(() => import('@/pages/lesson-plan/TopicPage'))
const ManageLessonPlanPage = lazy(() => import('@/pages/lesson-plan/ManageLessonPlanPage'))
const MyLessonsPage = lazy(() => import('@/pages/student/MyLessonsPage'))
const MyTopicsPage = lazy(() => import('@/pages/student/MyTopicsPage'))
const MyLessonPlansPage = lazy(() => import('@/pages/student/MyLessonPlansPage'))

// Alumni module — lazy-loaded so the bundle only downloads when a user visits Alumni pages
const ManageAlumniPage = lazy(() => import('@/pages/alumni/ManageAlumniPage'))
const AlumniEventsPage = lazy(() => import('@/pages/alumni/AlumniEventsPage'))

// Download Center module — lazy-loaded so the bundle only downloads when a user visits Download Center pages
const ContentTypePage = lazy(() => import('@/pages/download-center/ContentTypePage'))
const ContentShareListPage = lazy(() => import('@/pages/download-center/ContentShareListPage'))
const UploadShareContentPage = lazy(() => import('@/pages/download-center/UploadShareContentPage'))
const VideoTutorialsPage = lazy(() => import('@/pages/download-center/VideoTutorialsPage'))

// Inventory module — lazy-loaded so the bundle only downloads when a user visits Inventory pages
const ItemCategoryPage = lazy(() => import('@/pages/inventory/ItemCategoryPage'))
const ItemStorePage = lazy(() => import('@/pages/inventory/ItemStorePage'))
const ItemSupplierPage = lazy(() => import('@/pages/inventory/ItemSupplierPage'))
const ItemsPage = lazy(() => import('@/pages/inventory/ItemsPage'))
const ItemStockPage = lazy(() => import('@/pages/inventory/ItemStockPage'))
const IssueItemPage = lazy(() => import('@/pages/inventory/IssueItemPage'))

// Online Exam module — lazy-loaded so the bundle only downloads when a user visits Online Exam pages
const OnlineExamsPage = lazy(() => import('@/pages/online-exam/OnlineExamsPage'))
const QuestionBankPage = lazy(() => import('@/pages/online-exam/QuestionBankPage'))
const MyOnlineExamsPage = lazy(() => import('@/pages/student/MyOnlineExamsPage'))

// Certificate module — lazy-loaded so the bundle only downloads when a user visits Certificate pages
const StudentCertificatePage = lazy(() => import('@/pages/certificate/StudentCertificatePage'))
const GenerateCertificatePage = lazy(() => import('@/pages/certificate/GenerateCertificatePage'))
const StudentIdCardPage = lazy(() => import('@/pages/certificate/StudentIdCardPage'))
const GenerateStudentIdCardPage = lazy(() => import('@/pages/certificate/GenerateStudentIdCardPage'))
const StaffIdCardPage = lazy(() => import('@/pages/certificate/StaffIdCardPage'))
const GenerateStaffIdCardPage = lazy(() => import('@/pages/certificate/GenerateStaffIdCardPage'))

// Front CMS module — lazy-loaded so the bundle only downloads when a user visits Front CMS pages
const BannerPage = lazy(() => import('@/pages/front-cms/BannerPage'))
const NewsPage = lazy(() => import('@/pages/front-cms/NewsPage'))
const EventPage = lazy(() => import('@/pages/front-cms/EventPage'))
const GalleryPage = lazy(() => import('@/pages/front-cms/GalleryPage'))
const MediaManagerPage = lazy(() => import('@/pages/front-cms/MediaManagerPage'))
const PagePage = lazy(() => import('@/pages/front-cms/PagePage'))
const MenuPage = lazy(() => import('@/pages/front-cms/MenuPage'))

// Settings module — lazy-loaded so the bundle only downloads when a user visits Settings pages
const SettingsDashboardPage = lazy(() => import('@/pages/settings/SettingsDashboardPage'))
const GeneralSettingsPage = lazy(() => import('@/pages/settings/GeneralSettingsPage'))
const SessionSettingsPage = lazy(() => import('@/pages/settings/SessionSettingsPage'))
const RolePermissionPage = lazy(() => import('@/pages/settings/RolePermissionPage'))
const UsersSettingsPage = lazy(() => import('@/pages/settings/UsersSettingsPage'))
const NotificationSettingsPage = lazy(() => import('@/pages/settings/NotificationSettingsPage'))
const SmsSettingsPage = lazy(() => import('@/pages/settings/SmsSettingsPage'))
const PaymentSettingsPage = lazy(() => import('@/pages/settings/PaymentSettingsPage'))
const CurrencySettingsPage = lazy(() => import('@/pages/settings/CurrencySettingsPage'))
const LanguageSettingsPage = lazy(() => import('@/pages/settings/LanguageSettingsPage'))
const CaptchaSettingsPage = lazy(() => import('@/pages/settings/CaptchaSettingsPage'))
const ModulesPage = lazy(() => import('@/pages/settings/ModulesPage'))
const FrontCmsSettingsPage = lazy(() => import('@/pages/settings/FrontCmsSettingsPage'))
const CustomFieldPage = lazy(() => import('@/pages/settings/CustomFieldPage'))
const SystemFieldPage = lazy(() => import('@/pages/settings/SystemFieldPage'))
const FileTypePage = lazy(() => import('@/pages/settings/FileTypePage'))

// Student Portal pages
const MyProfilePage = lazy(() => import('@/pages/student/MyProfilePage'))
const MyAttendancePage = lazy(() => import('@/pages/student/MyAttendancePage'))
const StudentApplyLeavePage = lazy(() => import('@/pages/student/StudentApplyLeavePage'))
const MyLeaveRequestsPage = lazy(() => import('@/pages/student/MyLeaveRequestsPage'))
const StudentClassTimetablePage = lazy(() => import('@/pages/student/StudentClassTimetablePage'))
const StudentTeacherTimetablePage = lazy(() => import('@/pages/student/StudentTeacherTimetablePage'))
const StudentExamSchedulePage = lazy(() => import('@/pages/student/StudentExamSchedulePage'))
const MyResultsPage = lazy(() => import('@/pages/student/MyResultsPage'))
const MyMarksheetPage = lazy(() => import('@/pages/student/MyMarksheetPage'))
const MyAdmitCardPage = lazy(() => import('@/pages/student/MyAdmitCardPage'))
const DueFeesPage = lazy(() => import('@/pages/student/DueFeesPage'))
const PaymentHistoryPage = lazy(() => import('@/pages/student/PaymentHistoryPage'))
const MyHomeworkPage = lazy(() => import('@/pages/student/MyHomeworkPage'))
const StudentDailyAssignmentPage = lazy(() => import('@/pages/student/StudentDailyAssignmentPage'))
const SharedContentPage = lazy(() => import('@/pages/student/SharedContentPage'))
const StudentVideoTutorialsPage = lazy(() => import('@/pages/student/StudentVideoTutorialsPage'))
const StudentBooksPage = lazy(() => import('@/pages/student/StudentBooksPage'))
const MyLibraryPage = lazy(() => import('@/pages/student/MyLibraryPage'))
const MyTransportPage = lazy(() => import('@/pages/student/MyTransportPage'))
const MyCertificatesPage = lazy(() => import('@/pages/student/MyCertificatesPage'))
const MyIDCardPage = lazy(() => import('@/pages/student/MyIDCardPage'))
const NotificationsPage = lazy(() => import('@/pages/student/NotificationsPage'))

const NotFoundPage = lazy(() => import('@/pages/errors/NotFoundPage'))
const ForbiddenPage = lazy(() => import('@/pages/errors/ForbiddenPage'))

// Role-based access control wrapper for Attendance approve-leave
function ApproveLeavePageWrapper() {
  const { role } = useAuth()
  const allowedRoles = ['admin', 'staff', 'superadmin']

  if (!allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />
  }

  return <ApproveLeavePage />
}

// Role-based access control wrapper for HR approve-leave
function ApproveLeaveHRPageWrapper() {
  const { role } = useAuth()
  const allowedRoles = ['admin', 'superadmin']

  if (!allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />
  }

  return <ApproveLeaveHRPage />
}

// Role-based wrapper for Class Timetable - students see student version
function ClassTimetableWrapper() {
  const { role } = useAuth()
  if (role === 'student') {
    return <StudentClassTimetablePage />
  }
  return <ClassTimetablePage />
}

// Role-based wrapper for Teacher Timetable - students see student version
function TeacherTimetableWrapper() {
  const { role } = useAuth()
  if (role === 'student') {
    return <StudentTeacherTimetablePage />
  }
  return <TeachersTimetablePage />
}

// Role-based wrapper for Exam Schedule - students see student version
function ExamScheduleWrapper() {
  const { role } = useAuth()
  if (role === 'student') {
    return <StudentExamSchedulePage />
  }
  return <ExamSchedulePage />
}

// Role-based wrapper for Homework/Daily Assignment - students see student version
function DailyAssignmentWrapper() {
  const { role } = useAuth()
  if (role === 'student') {
    return <StudentDailyAssignmentPage />
  }
  return <DailyAssignmentPage />
}

// Role-based wrapper for Video Tutorials - students see student version
function VideoTutorialsWrapper() {
  const { role } = useAuth()
  if (role === 'student') {
    return <StudentVideoTutorialsPage />
  }
  return <VideoTutorialsPage />
}

// Role-based wrapper for Library Books - students see student version
function LibraryBooksWrapper() {
  const { role } = useAuth()
  if (role === 'student') {
    return <StudentBooksPage />
  }
  return <BookListPage />
}

// Student Route Protection - prevents students from accessing administrative routes
function StudentProtectedRoute({ children, allowedRoles = ['superadmin', 'admin', 'staff'] }) {
  const { role } = useAuth()
  if (role === 'student') {
    return <Navigate to="/dashboard" replace />
  }
  return children
}

// Role-based wrapper for Dashboard - students see student dashboard
function DashboardWrapper() {
  const { role } = useAuth()
  if (role === 'student') {
    return <StudentDashboardPage />
  }
  return <DashboardPage />
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <AuthLayout />
              </PublicRoute>
            }
          >
            <Route index element={<LoginPage />} />
          </Route>
          <Route
            path="/signup"
            element={
              <PublicRoute>
                <AuthLayout />
              </PublicRoute>
            }
          >
            <Route index element={<SignupPage />} />
          </Route>

          {/* Protected */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
          {/* ── Core modules ── */}
            <Route path="/dashboard" element={<DashboardWrapper />} />
            {/* Role-specific dashboard routes (post-login redirect targets) */}
            <Route path="/admin/dashboard" element={<DashboardPage />} />
            <Route path="/staff/dashboard" element={<DashboardPage />} />
            <Route path="/student/dashboard" element={<DashboardWrapper />} />
            <Route path="/parent/dashboard" element={<DashboardPage />} />
            <Route path="/schools" element={<StudentProtectedRoute><SchoolsPage /></StudentProtectedRoute>} />
            <Route path="/colleges" element={<StudentProtectedRoute><CollegesPage /></StudentProtectedRoute>} />
            <Route path="/domains" element={<StudentProtectedRoute><DomainsPage /></StudentProtectedRoute>} />
            <Route path="/students" element={<StudentProtectedRoute><StudentsPage /></StudentProtectedRoute>} />
            <Route path="/students/profile" element={<Navigate to="/students" replace />} />
            <Route path="/students/profile/:id" element={<StudentProtectedRoute><StudentProfilePage /></StudentProtectedRoute>} />
            <Route path="/students/admissions" element={<StudentProtectedRoute><AdmissionsPage /></StudentProtectedRoute>} />
            <Route path="/students/categories" element={<StudentProtectedRoute><StudentCategoriesPage /></StudentProtectedRoute>} />
            <Route path="/students/houses" element={<StudentProtectedRoute><StudentHousesPage /></StudentProtectedRoute>} />
            <Route path="/students/disabled" element={<StudentProtectedRoute><DisabledStudentsPage /></StudentProtectedRoute>} />
            <Route path="/students/multi-class" element={<StudentProtectedRoute><MultiClassStudentsPage /></StudentProtectedRoute>} />
             
            
            <Route
            path="/students/disable-reasons"
            element={<StudentProtectedRoute><DisableReasonsPage /></StudentProtectedRoute>}
            />

            

            <Route
            path="/students/bulk-delete"
            element={<StudentProtectedRoute><BulkDeletePage /></StudentProtectedRoute>}
            />



            

            <Route path="/academics/classes" element={<StudentProtectedRoute><ClassesPage /></StudentProtectedRoute>} />
            <Route path="/academics/sections" element={<StudentProtectedRoute><SectionsPage /></StudentProtectedRoute>} />
            <Route path="/academics/subjects" element={<StudentProtectedRoute><SubjectsPage /></StudentProtectedRoute>} />
            <Route path="/academics/subject-groups" element={<StudentProtectedRoute><SubjectGroupsPage /></StudentProtectedRoute>} />
            <Route path="/academics/assign-class-teacher" element={<StudentProtectedRoute><AssignClassTeacherPage /></StudentProtectedRoute>} />
            <Route path="/academics/promote-students" element={<StudentProtectedRoute><PromoteStudentsPage /></StudentProtectedRoute>} />
            <Route path="/academics/timetable" element={<ClassTimetableWrapper />} />
            <Route path="/academics/teachers-timetable" element={<TeacherTimetableWrapper />} />
            <Route path="/attendance" element={<StudentAttendancePage />} />
            <Route path="/attendance/apply-leave" element={<StudentLeaveApplication />} />
            <Route path="/attendance/approve-leave" element={<ApproveLeavePageWrapper />} />
            <Route path="/attendance/by-date" element={<StudentProtectedRoute><AttendanceByDatePage /></StudentProtectedRoute>} />
            <Route path="/examinations/exam-groups" element={<StudentProtectedRoute><ExamGroupsPage /></StudentProtectedRoute>} />
            <Route path="/examinations/schedule" element={<ExamScheduleWrapper />} />
            <Route path="/examinations/results" element={<StudentProtectedRoute><ExamResultsPage /></StudentProtectedRoute>} />
            <Route path="/examinations/design-admit-card" element={<StudentProtectedRoute><DesignAdmitCardPage /></StudentProtectedRoute>} />
            <Route path="/examinations/print-admit-card" element={<StudentProtectedRoute><PrintAdmitCardPage /></StudentProtectedRoute>} />
            <Route path="/examinations/design-marksheet" element={<StudentProtectedRoute><DesignMarksheetPage /></StudentProtectedRoute>} />
            <Route path="/examinations/print-marksheet" element={<StudentProtectedRoute><PrintMarksheetPage /></StudentProtectedRoute>} />
            <Route path="/examinations/marks-grade" element={<StudentProtectedRoute><MarksGradePage /></StudentProtectedRoute>} />
            <Route path="/examinations/marks-division" element={<StudentProtectedRoute><MarksDivisionPage /></StudentProtectedRoute>} />

            <Route path="/fees/collect" element={<StudentProtectedRoute><CollectFeesPage /></StudentProtectedRoute>} />
            <Route path="/fees/search-payment" element={<StudentProtectedRoute><SearchFeesPaymentPage /></StudentProtectedRoute>} />
            <Route path="/fees/search-due" element={<StudentProtectedRoute><SearchDueFeesPage /></StudentProtectedRoute>} />
            <Route path="/fees/offline-payment" element={<StudentProtectedRoute><OfflineBankPaymentPage /></StudentProtectedRoute>} />
            <Route path="/fees/reminder" element={<StudentProtectedRoute><FeesReminderPage /></StudentProtectedRoute>} />
            <Route path="/fees/master" element={<StudentProtectedRoute><FeesMasterPage /></StudentProtectedRoute>} />
            <Route path="/fees/group" element={<StudentProtectedRoute><FeesGroupPage /></StudentProtectedRoute>} />
            <Route path="/fees/type" element={<StudentProtectedRoute><FeesTypePage /></StudentProtectedRoute>} />
            <Route path="/fees/discount" element={<StudentProtectedRoute><FeesDiscountPage /></StudentProtectedRoute>} />
            <Route path="/fees/carry-forward" element={<StudentProtectedRoute><FeesCarryForwardPage /></StudentProtectedRoute>} />
            <Route path="/users" element={<StudentProtectedRoute><UsersPage /></StudentProtectedRoute>} />
            <Route path="/users/roles" element={<StudentProtectedRoute><RolesPage /></StudentProtectedRoute>} />
            <Route path="/super-admin" element={<StudentProtectedRoute><SuperAdminPage /></StudentProtectedRoute>} />
            <Route path="/settings" element={<StudentProtectedRoute><SettingsPage /></StudentProtectedRoute>} />
            <Route path="/profile" element={<ProfilePage />} />

            {/* ── Human Resources ── */}
            <Route path="/hr/staff" element={<StudentProtectedRoute><StaffDirectoryPage /></StudentProtectedRoute>} />
            <Route path="/hr/attendance" element={<StudentProtectedRoute><StaffAttendancePage /></StudentProtectedRoute>} />
            <Route path="/hr/payroll" element={<StudentProtectedRoute><PayrollPage /></StudentProtectedRoute>} />
            <Route path="/hr/approve-leave" element={<ApproveLeaveHRPageWrapper />} />
            <Route path="/hr/apply-leave" element={<StudentProtectedRoute><ApplyLeavePage /></StudentProtectedRoute>} />
            <Route path="/hr/leave-types" element={<StudentProtectedRoute><LeaveTypesPage /></StudentProtectedRoute>} />
            <Route path="/hr/teachers-rating" element={<StudentProtectedRoute><TeachersRatingPage /></StudentProtectedRoute>} />
            <Route path="/hr/departments" element={<StudentProtectedRoute><DepartmentPage /></StudentProtectedRoute>} />
            <Route path="/hr/designations" element={<StudentProtectedRoute><DesignationPage /></StudentProtectedRoute>} />
            <Route path="/hr/disabled-staff" element={<StudentProtectedRoute><DisabledStaffPage /></StudentProtectedRoute>} />

            {/* ── Front Office ── */}
            <Route path="/front-office/enquiry" element={<StudentProtectedRoute><AdmissionEnquiryPage /></StudentProtectedRoute>} />
            <Route path="/front-office/visitor-book" element={<StudentProtectedRoute><VisitorBookPage /></StudentProtectedRoute>} />
            <Route path="/front-office/call-log" element={<StudentProtectedRoute><PhoneCallLogPage /></StudentProtectedRoute>} />
            <Route path="/front-office/dispatch" element={<StudentProtectedRoute><PostalDispatchPage /></StudentProtectedRoute>} />
            <Route path="/front-office/receive" element={<StudentProtectedRoute><PostalReceivePage /></StudentProtectedRoute>} />
            <Route path="/front-office/complaint" element={<StudentProtectedRoute><ComplaintPage /></StudentProtectedRoute>} />
            <Route path="/front-office/setup" element={<StudentProtectedRoute><SetupFrontOfficePage /></StudentProtectedRoute>} />

            {/* ── Library ── */}
            <Route path="/library/books" element={<LibraryBooksWrapper />} />
            <Route path="/library/issue-return" element={<StudentProtectedRoute><IssueReturnPage /></StudentProtectedRoute>} />
            <Route path="/library/add-book" element={<StudentProtectedRoute><AddBookPage /></StudentProtectedRoute>} />
            <Route path="/library/staff" element={<StudentProtectedRoute><AddStaffMemberPage /></StudentProtectedRoute>} />
            <Route path="/library/students" element={<StudentProtectedRoute><LibraryStudentPage /></StudentProtectedRoute>} />

            {/* ── Transport ── */}
            <Route path="/transport/routes" element={<StudentProtectedRoute><RoutesPage /></StudentProtectedRoute>} />
            <Route path="/transport/vehicles" element={<StudentProtectedRoute><VehiclesPage /></StudentProtectedRoute>} />
            <Route path="/transport/pickup-points" element={<StudentProtectedRoute><PickupPointsPage /></StudentProtectedRoute>} />
            <Route path="/transport/assign-vehicle" element={<StudentProtectedRoute><AssignVehiclePage /></StudentProtectedRoute>} />
            <Route path="/transport/assign-pickup-point" element={<StudentProtectedRoute><AssignPickupPointPage /></StudentProtectedRoute>} />
            <Route path="/transport/fees" element={<StudentProtectedRoute><TransportFeesPage /></StudentProtectedRoute>} />
            <Route path="/transport/student-fees" element={<StudentProtectedRoute><StudentTransportFeesPage /></StudentProtectedRoute>} />

            {/* ── Hostel ── */}
            <Route path="/hostel/hostels" element={<StudentProtectedRoute><HostelListPage /></StudentProtectedRoute>} />
            <Route path="/hostel/room-types" element={<StudentProtectedRoute><RoomTypesPage /></StudentProtectedRoute>} />
            <Route path="/hostel/rooms" element={<StudentProtectedRoute><HostelRoomsPage /></StudentProtectedRoute>} />

            {/* ── Income ── */}
            <Route path="/income/head" element={<StudentProtectedRoute><IncomeHeadPage /></StudentProtectedRoute>} />
            <Route path="/income/add" element={<StudentProtectedRoute><AddIncomePage /></StudentProtectedRoute>} />
            <Route path="/income/search" element={<StudentProtectedRoute><SearchIncomePage /></StudentProtectedRoute>} />

            {/* ── Expenses ── */}
            <Route path="/expenses/head" element={<StudentProtectedRoute><ExpenseHeadPage /></StudentProtectedRoute>} />
            <Route path="/expenses/add" element={<StudentProtectedRoute><AddExpensePage /></StudentProtectedRoute>} />
            <Route path="/expenses/search" element={<StudentProtectedRoute><SearchExpensePage /></StudentProtectedRoute>} />

            {/* ── Homework ── */}
            <Route path="/homework/add" element={<StudentProtectedRoute><AddHomeworkPage /></StudentProtectedRoute>} />
            <Route path="/homework/daily-assignment" element={<DailyAssignmentWrapper />} />

            {/* ── Lesson Plan ── */}
            <Route path="/lesson-plan/lessons" element={<StudentProtectedRoute><LessonPage /></StudentProtectedRoute>} />
            <Route path="/lesson-plan/topics" element={<StudentProtectedRoute><TopicPage /></StudentProtectedRoute>} />
            <Route path="/lesson-plan/lesson-plans" element={<StudentProtectedRoute><ManageLessonPlanPage /></StudentProtectedRoute>} />

            {/* ── Alumni ── */}
            <Route path="/alumni" element={<StudentProtectedRoute><ManageAlumniPage /></StudentProtectedRoute>} />
            <Route path="/alumni/events" element={<StudentProtectedRoute><AlumniEventsPage /></StudentProtectedRoute>} />

            {/* ── Download Center ── */}
            <Route path="/download-center/content-types" element={<StudentProtectedRoute><ContentTypePage /></StudentProtectedRoute>} />
            <Route path="/download-center/share-list" element={<ContentShareListPage />} />
            <Route path="/download-center/contents" element={<StudentProtectedRoute><UploadShareContentPage /></StudentProtectedRoute>} />
            <Route path="/download-center/video-tutorials" element={<VideoTutorialsWrapper />} />

            {/* ── Inventory ── */}
            <Route path="/inventory/categories" element={<StudentProtectedRoute><ItemCategoryPage /></StudentProtectedRoute>} />
            <Route path="/inventory/stores" element={<StudentProtectedRoute><ItemStorePage /></StudentProtectedRoute>} />
            <Route path="/inventory/suppliers" element={<StudentProtectedRoute><ItemSupplierPage /></StudentProtectedRoute>} />
            <Route path="/inventory/items" element={<StudentProtectedRoute><ItemsPage /></StudentProtectedRoute>} />
            <Route path="/inventory/stock" element={<StudentProtectedRoute><ItemStockPage /></StudentProtectedRoute>} />
            <Route path="/inventory/issue" element={<StudentProtectedRoute><IssueItemPage /></StudentProtectedRoute>} />

            {/* ── Online Exam ── */}
            <Route path="/online-exam" element={<OnlineExamsPage />} />
            <Route path="/online-exam/question-bank" element={<StudentProtectedRoute><QuestionBankPage /></StudentProtectedRoute>} />

            {/* ── Certificate ── */}
            <Route path="/certificate/student" element={<StudentProtectedRoute><StudentCertificatePage /></StudentProtectedRoute>} />
            <Route path="/certificate/generate" element={<StudentProtectedRoute><GenerateCertificatePage /></StudentProtectedRoute>} />
            <Route path="/certificate/student-id-card" element={<StudentProtectedRoute><StudentIdCardPage /></StudentProtectedRoute>} />
            <Route path="/certificate/generate-id-card" element={<StudentProtectedRoute><GenerateStudentIdCardPage /></StudentProtectedRoute>} />
            <Route path="/certificate/staff-id-card" element={<StudentProtectedRoute><StaffIdCardPage /></StudentProtectedRoute>} />
            <Route path="/certificate/generate-staff-id-card" element={<StudentProtectedRoute><GenerateStaffIdCardPage /></StudentProtectedRoute>} />

            {/* ── Front CMS ── */}
            <Route path="/front-cms/banners" element={<StudentProtectedRoute><BannerPage /></StudentProtectedRoute>} />
            <Route path="/front-cms/news" element={<StudentProtectedRoute><NewsPage /></StudentProtectedRoute>} />
            <Route path="/front-cms/events" element={<StudentProtectedRoute><EventPage /></StudentProtectedRoute>} />
            <Route path="/front-cms/gallery" element={<StudentProtectedRoute><GalleryPage /></StudentProtectedRoute>} />
            <Route path="/front-cms/media" element={<StudentProtectedRoute><MediaManagerPage /></StudentProtectedRoute>} />
            <Route path="/front-cms/pages" element={<StudentProtectedRoute><PagePage /></StudentProtectedRoute>} />
            <Route path="/front-cms/menus" element={<StudentProtectedRoute><MenuPage /></StudentProtectedRoute>} />

            {/* ── Settings ── */}
            <Route path="/settings/dashboard" element={<StudentProtectedRoute><SettingsDashboardPage /></StudentProtectedRoute>} />
            <Route path="/settings/general" element={<StudentProtectedRoute><GeneralSettingsPage /></StudentProtectedRoute>} />
            <Route path="/settings/session" element={<StudentProtectedRoute><SessionSettingsPage /></StudentProtectedRoute>} />
            <Route path="/settings/roles" element={<StudentProtectedRoute><RolePermissionPage /></StudentProtectedRoute>} />
            <Route path="/settings/users" element={<StudentProtectedRoute><UsersSettingsPage /></StudentProtectedRoute>} />
            <Route path="/settings/notifications" element={<StudentProtectedRoute><NotificationSettingsPage /></StudentProtectedRoute>} />
            <Route path="/settings/sms" element={<StudentProtectedRoute><SmsSettingsPage /></StudentProtectedRoute>} />
            <Route path="/settings/payment" element={<StudentProtectedRoute><PaymentSettingsPage /></StudentProtectedRoute>} />
            <Route path="/settings/currency" element={<StudentProtectedRoute><CurrencySettingsPage /></StudentProtectedRoute>} />
            <Route path="/settings/language" element={<StudentProtectedRoute><LanguageSettingsPage /></StudentProtectedRoute>} />
            <Route path="/settings/captcha" element={<StudentProtectedRoute><CaptchaSettingsPage /></StudentProtectedRoute>} />
            <Route path="/settings/modules" element={<StudentProtectedRoute><ModulesPage /></StudentProtectedRoute>} />
            <Route path="/settings/front-cms" element={<StudentProtectedRoute><FrontCmsSettingsPage /></StudentProtectedRoute>} />
            <Route path="/settings/custom-fields" element={<StudentProtectedRoute><CustomFieldPage /></StudentProtectedRoute>} />
            <Route path="/settings/system-fields" element={<StudentProtectedRoute><SystemFieldPage /></StudentProtectedRoute>} />
            <Route path="/settings/file-types" element={<StudentProtectedRoute><FileTypePage /></StudentProtectedRoute>} />

            {/* ── Student Portal ── */}
            <Route path="/my-profile" element={<MyProfilePage />} />
            <Route path="/attendance/my-attendance" element={<MyAttendancePage />} />
            <Route path="/attendance/my-leave-requests" element={<MyLeaveRequestsPage />} />
            <Route path="/examinations/my-results" element={<MyResultsPage />} />
            <Route path="/examinations/my-marksheet" element={<MyMarksheetPage />} />
            <Route path="/examinations/my-admit-card" element={<MyAdmitCardPage />} />
            <Route path="/fees/due-fees" element={<DueFeesPage />} />
            <Route path="/fees/payment-history" element={<PaymentHistoryPage />} />
            <Route path="/homework/my-homework" element={<MyHomeworkPage />} />
            <Route path="/download-center/shared-content" element={<SharedContentPage />} />
            <Route path="/library/my-library" element={<MyLibraryPage />} />
            <Route path="/transport/my-transport" element={<MyTransportPage />} />
            <Route path="/online-exam/my-exams" element={<MyOnlineExamsPage />} />
            <Route path="/lesson-plan/my-lessons" element={<MyLessonsPage />} />
            <Route path="/lesson-plan/my-topics" element={<MyTopicsPage />} />
            <Route path="/lesson-plan/my-lesson-plans" element={<MyLessonPlansPage />} />
            <Route path="/certificate/my-certificates" element={<MyCertificatesPage />} />
            <Route path="/certificate/my-id-card" element={<MyIDCardPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
          </Route>

          {/* Errors */}
          {/* ── Error / fallback routes ── */}
          <Route path="/403" element={<ForbiddenPage />} />
          <Route path="/unauthorized" element={<ForbiddenPage />} />
          <Route path="/404" element={<NotFoundPage />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
