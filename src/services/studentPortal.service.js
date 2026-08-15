// ====================================================================
// Student Portal Service
//
// Student-specific API methods that build on existing services
// with appropriate filtering and student-focused operations.
//
// This service provides a unified interface for student self-service features.
// ====================================================================

import apiClient from './api'
import { studentService } from './student.service'
import { attendanceService } from './attendance.service'
import { academicsService } from './academics.service'
import { examinationService } from './examination.service'
import { feesService } from './fees.service'
import { homeworkService } from './homework.service'
import { downloadCenterService } from './downloadCenter.service'
import { libraryService } from './library.service'
import { transportService } from './transport.service'
import { certificateService } from './certificate.service'

export const studentPortalService = {
  // ==========================================================
  // My Profile
  // ==========================================================
  
  async getMyProfile(studentId) {
    return studentService.get(studentId)
  },
  
  async updateMyProfile(studentId, payload) {
    // Only allow safe fields to be updated
    const safePayload = {
      mobile: payload.mobile,
      email: payload.email,
      guardian: payload.guardian,
    }
    return studentService.update(studentId, safePayload)
  },

  // ==========================================================
  // My Attendance
  // ==========================================================
  
  async getMyAttendance(studentId) {
    const allAttendance = await attendanceService.list()
    
    // Filter to only show student's own attendance
    if (Array.isArray(allAttendance)) {
      const filtered = allAttendance.filter(att => 
        att.student_id === studentId || 
        att.student?._id === studentId
      )
      // If no match, return all for now to debug
      return filtered.length > 0 ? filtered : allAttendance
    }
    return []
  },
  
  async applyLeave(payload) {
    return attendanceService.createLeave(payload)
  },
  
  async getMyLeaveRequests(studentId) {
    const allLeaves = await attendanceService.getLeaves()
    // Filter to only show student's own leave requests
    if (Array.isArray(allLeaves)) {
      return allLeaves.filter(leave => 
        leave.student_id === studentId || 
        leave.student?._id === studentId
      )
    }
    return []
  },

  // ==========================================================
  // Academics
  // ==========================================================
  
  async getClassTimetable(studentClass) {
    const allTimetables = await academicsService.classTimetable()
    const classes = await academicsService.classes()
    
    // Build a map of class_id to class_name
    const classMap = {}
    if (Array.isArray(classes)) {
      classes.forEach(cls => {
        classMap[cls._id] = cls.class_name
      })
    }
    
    // Filter to show timetable for student's class if possible
    if (Array.isArray(allTimetables) && studentClass) {
      const filtered = allTimetables.filter(timetable => {
        // Check by class name directly
        if (timetable.class_name?.toLowerCase() === studentClass.toLowerCase()) return true
        // Check by the embedded class object
        if (timetable.class?.class_name?.toLowerCase() === studentClass.toLowerCase()) return true
        // Check by class_id (if studentClass happens to be an ID)
        if (timetable.class_id === studentClass) return true
        // Check by mapping class_id to class_name
        const className = classMap[timetable.class_id]
        if (className?.toLowerCase() === studentClass.toLowerCase()) return true
        // Check if studentClass is a partial match (e.g., "12" matches "12B")
        if (className?.toLowerCase().startsWith(studentClass.toLowerCase())) return true
        return false
      })
      // If filtering returns no results, return all timetables for now
      return filtered.length > 0 ? filtered : allTimetables
    }
    return allTimetables || []
  },
  
  async getTeacherTimetable(teacherId) {
    // For students, we'll use class timetable data which includes teacher information
    // and display it as teacher timetable
    const allTimetables = await academicsService.classTimetable()
    return allTimetables || []
  },

  // ==========================================================
  // Examinations
  // ==========================================================
  
  async getExamSchedule(studentClass) {
    const allSchedules = await examinationService.getExamSchedules()
    const classes = await academicsService.classes()
    const subjects = await academicsService.subjects()
    const examGroups = await examinationService.getExamGroups()
    
    // Build lookup maps
    const classMap = {}
    if (Array.isArray(classes)) {
      classes.forEach(cls => {
        classMap[cls._id] = cls.class_name
      })
    }
    
    const subjectMap = {}
    if (Array.isArray(subjects)) {
      subjects.forEach(sub => {
        subjectMap[sub._id] = sub.subject_name
      })
    }
    
    const examGroupMap = {}
    if (Array.isArray(examGroups)) {
      examGroups.forEach(eg => {
        examGroupMap[eg._id] = eg.exam_name || eg.name || eg.exam_group_name || eg.title || eg.exam_group
      })
    }
    
    // Enrich schedules with names
    const enrichedSchedules = allSchedules.map(schedule => ({
      ...schedule,
      exam_group: examGroupMap[schedule.exam_group_id] || 'Unknown',
      subject_name: subjectMap[schedule.subject_id] || 'Unknown',
      class_name: classMap[schedule.class_id] || 'Unknown',
    }))
    
    // Filter to show exams for student's class if possible
    if (Array.isArray(enrichedSchedules) && studentClass) {
      const filtered = enrichedSchedules.filter(schedule => {
        // Check by class name directly
        if (schedule.class_name?.toLowerCase() === studentClass.toLowerCase()) return true
        // Check by the embedded class object
        if (schedule.class?.class_name?.toLowerCase() === studentClass.toLowerCase()) return true
        // Check by class_id (if studentClass happens to be an ID)
        if (schedule.class_id === studentClass) return true
        // Check by mapping class_id to class_name
        const className = classMap[schedule.class_id]
        if (className?.toLowerCase() === studentClass.toLowerCase()) return true
        // Check if studentClass is a partial match (e.g., "12" matches "12B")
        if (className?.toLowerCase().startsWith(studentClass.toLowerCase())) return true
        return false
      })
      // If filtering returns no results, return all for now to debug
      return filtered.length > 0 ? filtered : enrichedSchedules
    }
    return enrichedSchedules || []
  },
  
  async getMyResults(studentId) {
    const allResults = await examinationService.getExamResults()
    const subjects = await academicsService.subjects()
    const examGroups = await examinationService.getExamGroups()
    const classes = await academicsService.classes()
    const students = await studentService.list({ page: 1, limit: 100 })
    
    // Build lookup maps
    const subjectMap = {}
    if (Array.isArray(subjects)) {
      subjects.forEach(sub => {
        subjectMap[sub._id] = sub.subject_name
      })
    }
    
    const examGroupMap = {}
    if (Array.isArray(examGroups)) {
      examGroups.forEach(eg => {
        examGroupMap[eg._id] = eg.exam_name || eg.name || eg.exam_group_name || eg.title || eg.exam_group
      })
    }
    
    const classMap = {}
    if (Array.isArray(classes)) {
      classes.forEach(cls => {
        classMap[cls._id] = cls.class_name
      })
    }
    
    const studentMap = {}
    if (Array.isArray(students)) {
      const studentList = Array.isArray(students) ? students : (students?.data || [])
      studentList.forEach(student => {
        studentMap[student._id] = student
      })
    }
    
    // Enrich results with names and calculate percentage
    const enrichedResults = allResults.map(result => {
      const student = studentMap[result.student_id] || result.student
      const studentName = student?.name ? `${student.name.first} ${student.name.last}` : 'Unknown'
      const className = classMap[result.class_id] || student?.class_name || 'Unknown'
      const section = student?.section || '—'
      const examGroup = examGroupMap[result.exam_group_id] || 'Unknown'
      const subjectName = subjectMap[result.subject_id] || 'Unknown'
      const obtained = result.marks_obtained || 0
      const total = result.total_marks || 100
      const percentage = total > 0 ? ((obtained / total) * 100).toFixed(2) : '0.00'
      
      return {
        ...result,
        student_data: student,
        class_section: `${className} - ${section}`,
        exam_group: examGroup,
        subject_name: subjectName,
        percentage: percentage,
      }
    })
    
    // Filter to show results for this student
    if (Array.isArray(enrichedResults) && studentId) {
      const filtered = enrichedResults.filter(result => 
        result.student_id === studentId || 
        result.student?._id === studentId
      )
      // If no match, return all for now to debug
      return filtered.length > 0 ? filtered : enrichedResults
    }
    return enrichedResults || []
  },
  
  async getMyMarksheet(studentId) {
    return examinationService.printMarksheet(studentId)
  },
  
  async getMyAdmitCard(studentId) {
    return examinationService.printAdmitCard(studentId)
  },

  // ==========================================================
  // Fees
  // ==========================================================
  
  async getMyDueFees(studentId) {
    const allDueFees = await feesService.searchDueFees()
    // Filter to only show student's own due fees
    if (Array.isArray(allDueFees)) {
      return allDueFees.filter(fee => 
        fee.student_id === studentId || 
        fee.student?._id === studentId
      )
    }
    return []
  },
  
  async getMyPaymentHistory(studentId) {
    // The getFeesPayments API requires a keyword parameter
    // Use the student's roll number or name as keyword to search for their payments
    try {
      // First fetch student profile to get roll number
      const student = await studentService.get(studentId)
      const keyword = student?.roll_number || student?.name?.first || ''
      
      const allPayments = await feesService.getFeesPayments(keyword)
      // Filter to only show student's own payment history
      if (Array.isArray(allPayments)) {
        if (allPayments.length > 0) {
          // Keep for debugging if needed
        }
        const filtered = allPayments.filter(payment => {
          const paymentStudentId = typeof payment.student_id === 'object' 
            ? payment.student_id._id 
            : payment.student_id
          return paymentStudentId === studentId
        })
        return filtered
      }
      return []
    } catch (error) {
      return []
    }
  },

  // ==========================================================
  // Homework
  // ==========================================================
  
  async getMyHomework(studentClass) {
    const allHomework = await homeworkService.getHomeworks()
    // Filter to show homework for student's class if possible
    if (Array.isArray(allHomework) && studentClass) {
      return allHomework.filter(hw => 
        hw.class_id === studentClass ||
        hw.class_name === studentClass
      )
    }
    return allHomework || []
  },
  
  async getMyDailyAssignments(studentClass) {
    const allAssignments = await homeworkService.getDailyAssignments()
    // Filter to show assignments for student's class if possible
    if (Array.isArray(allAssignments) && studentClass) {
      return allAssignments.filter(assignment => 
        assignment.class_id === studentClass ||
        assignment.class_name === studentClass
      )
    }
    return allAssignments || []
  },

  // ==========================================================
  // Download Center
  // ==========================================================
  
  async getSharedContent(studentClass) {
    const allContent = await downloadCenterService.getShareLists()
    // Filter to show content shared with student's class if possible
    if (Array.isArray(allContent) && studentClass) {
      return allContent.filter(content => 
        content.class_id === studentClass ||
        content.class_name === studentClass ||
        !content.class_id // Show general content
      )
    }
    return allContent || []
  },
  
  async getVideoTutorials() {
    return downloadCenterService.getVideoTutorials()
  },

  // ==========================================================
  // Library
  // ==========================================================
  
  async getAvailableBooks() {
    return libraryService.getBookList()
  },
  
  async getMyLibrary(studentId) {
    const allIssues = await libraryService.getIssueReturns()
    // Filter to show student's own library records
    if (Array.isArray(allIssues)) {
      return allIssues.filter(issue => 
        issue.member_id === studentId || 
        issue.member?._id === studentId ||
        issue.student_id === studentId ||
        issue.student?._id === studentId
      )
    }
    return []
  },
  
  async getMyLibraryMembership(studentId) {
    return libraryService.getLibraryStudentById(studentId)
  },

  // ==========================================================
  // Transport
  // ==========================================================
  
  async getMyTransport(studentId) {
    const allTransportFees = await transportService.getStudentTransportFees()
    // Filter to show student's own transport information
    if (Array.isArray(allTransportFees)) {
      return allTransportFees.filter(transport => 
        transport.student_id === studentId || 
        transport.student?._id === studentId
      )
    }
    return []
  },
  
  async getTransportRoutes() {
    return transportService.getTransportRoutes()
  },
  
  async getTransportVehicles() {
    return transportService.getVehicles()
  },

  // ==========================================================
  // Certificates
  // ==========================================================
  
  async getMyCertificates(studentId) {
    // Use the generate-certificate endpoint to get certificates generated for this student
    const allCertificates = await certificateService.getGeneratedCertificates()
    
    // Filter to show student's own generated certificates
    if (Array.isArray(allCertificates)) {
      const filtered = allCertificates.filter(certificate => {
        // The main matching - check if student_id matches exactly
        const directMatch = certificate.student_id === studentId
        const stringMatch = String(certificate.student_id) === String(studentId)
        
        // Only return true if there's a direct match
        return directMatch || stringMatch
      })
      
      // Enrich certificates with template details
      const enrichedCertificates = await Promise.all(filtered.map(async (cert) => {
        if (cert.certificate_id) {
          try {
            const template = await certificateService.getStudentCertificateById(cert.certificate_id)
            return {
              ...cert,
              certificate_name: template?.certificate_name || template?.name || 'Certificate',
              template: template?.template || template?.template_type || 'Default',
              header: template?.header || '',
              body_text: template?.body_text || '',
            }
          } catch (error) {
            return cert
          }
        }
        return cert
      }))
      
      return enrichedCertificates
    }
    return []
  },

  async getMyIDCard(studentId) {
    // Use the generate-id-card endpoint to get ID cards generated for this student
    const allIdCards = await certificateService.getGeneratedStudentIdCards()
    
    // Filter to show student's own generated ID card
    if (Array.isArray(allIdCards)) {
      const filtered = allIdCards.filter(idCard => {
        // Check multiple possible fields where student_id might be stored
        const directMatch = idCard.student_id === studentId
        const objectMatch = idCard.student?._id === studentId
        const stringMatch = String(idCard.student_id) === String(studentId)
        const objectIdMatch = idCard.student_id?.toString() === studentId?.toString()
        
        return directMatch || objectMatch || stringMatch || objectIdMatch
      })
      
      return filtered
    }
    return []
  },

  // ==========================================================
  // Notifications
  // ==========================================================
  
  async getNotifications() {
    return apiClient.get('/notification')
  },
}

export default studentPortalService
