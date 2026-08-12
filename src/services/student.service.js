import apiClient from './api'

// The student-information routes are mounted by index.js under /api/student.
// Keep all field shaping here so pages never send legacy/mock field names.
const value = (item, key) => item?.[key] === '' ? undefined : item?.[key]

function studentPayload(input = {}) {
  const payload = {
    roll_number: value(input, 'roll_number'),
    class_name: value(input, 'class_name'),
    section: value(input, 'section'),
    name: {
      first: value(input, 'first_name') ?? input.name?.first,
      last: value(input, 'last_name') ?? input.name?.last,
    },
    gender: value(input, 'gender'),
    dob: value(input, 'dob'),
    blood_group: value(input, 'blood_group'),
    religion: value(input, 'religion'),
    caste: value(input, 'caste'),
    mobile: value(input, 'mobile'),
    email: value(input, 'email'),
    password: value(input, 'password'),
    admission_date: value(input, 'admission_date'),
    category: value(input, 'category'),
    house: value(input, 'house'),
    height: value(input, 'height'),
    weight: value(input, 'weight'),
    guardian: {
      name: value(input, 'guardian_name') ?? input.guardian?.name,
      relation: value(input, 'guardian_relation') ?? input.guardian?.relation,
      phone: value(input, 'guardian_phone') ?? input.guardian?.phone,
      email: value(input, 'guardian_email') ?? input.guardian?.email,
      occupation: value(input, 'guardian_occupation') ?? input.guardian?.occupation,
      address: value(input, 'guardian_address') ?? input.guardian?.address,
    },
    transport: input.transport ? {
      route_id: typeof input.transport.route_id === 'object' ? input.transport.route_id?._id : input.transport.route_id,
      pickup_point: input.transport.pickup_point,
      fees_month: input.transport.fees_month,
    } : undefined,
    hostel: input.hostel ? {
      hostel_id: typeof input.hostel.hostel_id === 'object' ? input.hostel.hostel_id?._id : input.hostel.hostel_id,
      room_no: input.hostel.room_no,
    } : undefined,
    role: value(input, 'role'),
    status: value(input, 'status'),
  }

  // Remove empty transport/hostel objects
  if (payload.transport && !payload.transport.route_id && !payload.transport.pickup_point && !payload.transport.fees_month) {
    delete payload.transport
  }
  if (payload.hostel && !payload.hostel.hostel_id && !payload.hostel.room_no) {
    delete payload.hostel
  }

  return removeUndefined(payload)
}

function removeUndefined(input) {
  if (Array.isArray(input)) return input.map(removeUndefined)
  if (!input || typeof input !== 'object') return input
  return Object.fromEntries(
    Object.entries(input)
      .filter(([, item]) => item !== undefined && item !== null)
      .map(([key, item]) => [key, removeUndefined(item)]),
  )
}

const referenceId = (value) => typeof value === 'object' ? value?._id : value

function hasFiles(input) {
  return Boolean(input?.student_photo || input?.guardian_photo || input?.documents)
}

function studentMultipart(input) {
  const form = new FormData()
  
  // Handle form fields directly from input for multipart
  // Nested objects use dot notation for backend parsing
  Object.entries(input).forEach(([key, item]) => {
    if (key === 'name' || key === 'guardian') {
      Object.entries(item || {}).forEach(([nestedKey, nestedValue]) => {
        if (nestedValue !== undefined && nestedValue !== null && nestedValue !== '') {
          form.append(`${key}.${nestedKey}`, nestedValue)
        }
      })
    } else if (key === 'transport') {
      // Only include transport if it has values
      if (item && (item.route_id || item.pickup_point || item.fees_month)) {
        Object.entries(item).forEach(([nestedKey, nestedValue]) => {
          if (nestedValue !== undefined && nestedValue !== null && nestedValue !== '') {
            form.append(`${key}.${nestedKey}`, nestedValue)
          }
        })
      }
    } else if (key === 'hostel') {
      // Only include hostel if it has values
      if (item && (item.hostel_id || item.room_no)) {
        Object.entries(item).forEach(([nestedKey, nestedValue]) => {
          if (nestedValue !== undefined && nestedValue !== null && nestedValue !== '') {
            form.append(`${key}.${nestedKey}`, nestedValue)
          }
        })
      }
    } else if (key === 'student_photo' || key === 'guardian_photo' || key === 'documents') {
      // Skip file fields - they are handled separately
    } else if (key !== 'files') {
      // Regular fields
      if (item !== undefined && item !== null && item !== '') {
        form.append(key, item)
      }
    }
  })
  
  // Handle file uploads - these should be File objects
  if (input.student_photo instanceof File) {
    form.append('student_photo', input.student_photo)
  }
  if (input.guardian_photo instanceof File) {
    form.append('guardian_photo', input.guardian_photo)
  }
  if (input.documents instanceof File) {
    form.append('documents', input.documents)
  }
  
  return form
}

function admissionPayload(input = {}) {
  return removeUndefined({
    class_name: input.class_name,
    name: {
      first: input.first_name ?? input.name?.first,
      last: input.last_name ?? input.name?.last,
    },
    gender: input.gender,
    dob: input.dob,
    mobile: input.mobile,
    email: input.email,
    guardian: {
      name: input.guardian_name ?? input.guardian?.name,
      phone: input.guardian_phone ?? input.guardian?.phone,
      email: input.guardian_email ?? input.guardian?.email,
    },
    status: input.status,
  })
}

function admissionMultipart(input) {
  const payload = admissionPayload(input)
  const form = new FormData()
  Object.entries(payload).forEach(([key, item]) => {
    if (key === 'name' || key === 'guardian') {
      Object.entries(item || {}).forEach(([nestedKey, nestedValue]) => {
        if (nestedValue !== undefined && nestedValue !== null && nestedValue !== '') {
          form.append(`${key}.${nestedKey}`, nestedValue)
        }
      })
    } else {
      form.append(key, item)
    }
  })
  if (input.guardian_photo) form.append('guardian_photo', input.guardian_photo)
  if (input.documents) form.append('documents', input.documents)
  return form
}

export const studentService = {
  // Student details: /api/students (list, get, update, delete)
  list: (params = {}) => apiClient.get('/students', { params }),
  get: (id) => apiClient.get(`/students/${id}`),
  create: (payload) => {
    // Create uses different endpoint: /api/student/details/add
    const hasFiles = payload?.student_photo || payload?.guardian_photo || payload?.documents
    return apiClient.post(
      '/student/details/add',
      hasFiles ? studentMultipart(payload) : studentPayload(payload),
      hasFiles ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined,
    )
  },
  update: (id, payload) => apiClient.put(`/students/${id}`, studentPayload(payload)),
  remove: (id) => apiClient.delete(`/students/${id}`),

  // Bulk delete: POST /api/student/bulk-delete/students with { ids: [] }
  bulkDelete: (ids) => apiClient.post('/student/bulk-delete/students', { ids }),

  // DisabledStudent CRUD: /api/student/disabled
  disabled: (params = {}) => apiClient.get('/student/disabled', { params }),
  getDisabledStudent: (id) => apiClient.get(`/student/disabled/${id}`),
  createDisabledStudent: (payload) => apiClient.post('/student/disabled', {
    student_id: referenceId(payload.student_id),
    reason_id: referenceId(payload.reason_id),
    date: payload.date,
  }),
  updateDisabledStudent: (id, payload) => apiClient.put(`/student/disabled/${id}`, {
    student_id: referenceId(payload.student_id),
    reason_id: referenceId(payload.reason_id),
    date: payload.date,
  }),
  deleteDisabledStudent: (id) => apiClient.delete(`/student/disabled/${id}`),

  // OnlineAdmission CRUD: /api/student/online-admission
  admissions: (params = {}) => apiClient.get('/student/online-admission/all', { params }),
  getAdmission: (id) => apiClient.get(`/student/online-admission/${id}`),
  createAdmission: (payload) => {
    const multipart = payload instanceof FormData || payload.guardian_photo || payload.documents
    return apiClient.post(
      '/student/online-admission/add',
      multipart ? (payload instanceof FormData ? payload : admissionMultipart(payload)) : admissionPayload(payload),
      multipart ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined,
    )
  },
  updateAdmission: (id, payload) => apiClient.put(`/student/online-admission/${id}`, admissionPayload(payload)),
  deleteAdmission: (id) => apiClient.delete(`/student/online-admission/${id}`),

  // StudentCategory CRUD: /api/student/category
  categories: (params = {}) => apiClient.get('/student/category', { params }),
  getCategory: (id) => apiClient.get(`/student/category/${id}`),
  createCategory: (payload) => apiClient.post('/student/category', { category_name: payload.category_name }),
  updateCategory: (id, payload) => apiClient.put(`/student/category/${id}`, { category_name: payload.category_name }),
  deleteCategory: (id) => apiClient.delete(`/student/category/${id}`),

  // StudentHouse CRUD: /api/student/house
  houses: (params = {}) => apiClient.get('/student/house', { params }),
  getHouse: (id) => apiClient.get(`/student/house/${id}`),
  createHouse: (payload) => apiClient.post('/student/house', {
    house_name: payload.house_name,
    house_color: payload.house_color,
  }),
  updateHouse: (id, payload) => apiClient.put(`/student/house/${id}`, {
    house_name: payload.house_name,
    house_color: payload.house_color,
  }),
  deleteHouse: (id) => apiClient.delete(`/student/house/${id}`),

  // DisableReason CRUD: /api/student/disable-reason
  disableReasons: (params = {}) => apiClient.get('/student/disable-reason', { params }),
  getDisableReason: (id) => apiClient.get(`/student/disable-reason/${id}`),
  createDisableReason: (payload) => apiClient.post('/student/disable-reason', { reason: payload.reason }),
  updateDisableReason: (id, payload) => apiClient.put(`/student/disable-reason/${id}`, { reason: payload.reason }),
  deleteDisableReason: (id) => apiClient.delete(`/student/disable-reason/${id}`),

  // MultiClassStudent CRUD: /api/student/multi-class
  multiClassStudents: (params = {}) => apiClient.get('/student/multi-class', { params }),
  getMultiClassStudent: (id) => apiClient.get(`/student/multi-class/${id}`),
  createMultiClassStudent: (payload) => apiClient.post('/student/multi-class', {
    student_id: referenceId(payload.student_id),
    class_id: referenceId(payload.class_id),
  }),
  updateMultiClassStudent: (id, payload) => apiClient.put(`/student/multi-class/${id}`, {
    student_id: referenceId(payload.student_id),
    class_id: referenceId(payload.class_id),
  }),
  deleteMultiClassStudent: (id) => apiClient.delete(`/student/multi-class/${id}`),
}

export default studentService
