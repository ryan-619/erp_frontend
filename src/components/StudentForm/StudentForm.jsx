import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { FormSection } from '@/components/FormSection'
import { fullName } from '@/utils/format'
import { academicsService } from '@/services/academics.service'
import { transportService } from '@/services/transport.service'
import { hostelService } from '@/services/hostel.service'

const dateValue = (date) => date ? new Date(date).toISOString().slice(0, 10) : ''
const referenceId = (value) => typeof value === 'object' ? value?._id || '' : value || ''

const initialForm = (student) => ({
  roll_number: student?.roll_number || '',
  class_name: student?.class_name || '',
  section: student?.section || '',
  name: {
    first: student?.name?.first || '',
    last: student?.name?.last || '',
  },
  gender: student?.gender || '',
  dob: dateValue(student?.dob),
  blood_group: student?.blood_group || '',
  religion: student?.religion || '',
  caste: student?.caste || '',
  mobile: student?.mobile || '',
  email: student?.email || '',
  password: '',
  admission_date: dateValue(student?.admission_date),
  category: student?.category || '',
  house: student?.house || '',
  height: student?.height ?? '',
  weight: student?.weight ?? '',
  guardian: {
    name: student?.guardian?.name || '',
    relation: student?.guardian?.relation || '',
    phone: student?.guardian?.phone || '',
    email: student?.guardian?.email || '',
    occupation: student?.guardian?.occupation || '',
    address: student?.guardian?.address || '',
  },
  transport: {
    route_id: referenceId(student?.transport?.route_id),
    pickup_point: student?.transport?.pickup_point || '',
    fees_month: student?.transport?.fees_month || '',
  },
  hostel: {
    hostel_id: referenceId(student?.hostel?.hostel_id),
    room_no: student?.hostel?.room_no || '',
  },
  status: student?.status || 'active',
  student_photo: null,
  guardian_photo: null,
  documents: null,
})

function Field({ label, required, error, children }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}{required ? <span className="text-destructive"> *</span> : null}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  )
}

function SelectField({ value, onChange, children, placeholder = 'Select' }) {
  return (
    <select 
      value={value ?? ''} 
      onChange={(event) => onChange(event.target.value)} 
      className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
    >
      <option value="">{placeholder}</option>
      {children}
    </select>
  )
}

export function StudentForm({ initial, onSubmit }) {
  const [form, setForm] = useState(() => initialForm(initial))
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  
  // Fetch options from backend
  const [classOptions, setClassOptions] = useState([])
  const [sectionOptions, setSectionOptions] = useState([])
  const [routeOptions, setRouteOptions] = useState([])
  const [hostelOptions, setHostelOptions] = useState([])
  const [loadingOptions, setLoadingOptions] = useState(false)

  useEffect(() => {
    const fetchOptions = async () => {
      setLoadingOptions(true)
      try {
        const [classesData, sectionsData, routesData, hostelsData] = await Promise.all([
          academicsService.classes(),
          academicsService.sections(),
          transportService.getTransportRoutes(),
          hostelService.getHostels()
        ])
        
        const classes = Array.isArray(classesData) ? classesData : classesData?.data || []
        const sections = Array.isArray(sectionsData) ? sectionsData : sectionsData?.data || []
        const routes = Array.isArray(routesData) ? routesData : routesData?.data || []
        const hostels = Array.isArray(hostelsData) ? hostelsData : hostelsData?.data || []
        
        setClassOptions(classes.map((cls) => ({ value: cls.class_name, label: cls.class_name })))
        setSectionOptions(sections.map((sec) => ({ value: sec.section_name, label: sec.section_name })))
        setRouteOptions(routes.map((route) => ({ value: route._id, label: route.route_name || route.route_start })))
        setHostelOptions(hostels.map((hostel) => ({ value: hostel._id, label: hostel.hostel_name })))
      } catch (error) {
        console.error('Failed to fetch options:', error)
      } finally {
        setLoadingOptions(false)
      }
    }
    
    fetchOptions()
  }, [])

  const setField = (key, value) => setForm((current) => ({ ...current, [key]: value }))
  const setNested = (group, key, value) => setForm((current) => ({
    ...current,
    [group]: { ...current[group], [key]: value },
  }))

  const validate = () => {
    const next = {}
    if (!form.name.first.trim()) next.first = 'First name is required'
    if (!form.class_name.trim()) next.class_name = 'Class name is required'
    setErrors(next)
    return !Object.keys(next).length
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    try {
      await onSubmit?.(form)
    } finally {
      setSubmitting(false)
    }
  }
return (
  <form id="student-form" onSubmit={handleSubmit} className="space-y-8">
    <FormSection title="Identity" description="Required student identity and contact fields" columns={2}>
      <Field label="First name" required error={errors.first}>
        <Input className="h-10" value={form.name.first} onChange={(e) => setNested('name', 'first', e.target.value)} placeholder="e.g. John" />
      </Field>
      <Field label="Last name">
        <Input className="h-10" value={form.name.last} onChange={(e) => setNested('name', 'last', e.target.value)} placeholder="e.g. Doe" />
      </Field>
      <Field label="Email">
        <Input type="email" className="h-10" value={form.email} onChange={(e) => setField('email', e.target.value)} placeholder="student@school.com" />
      </Field>
      <Field label="Mobile">
        <Input className="h-10" value={form.mobile} onChange={(e) => setField('mobile', e.target.value)} placeholder="+91 9876543210" />
      </Field>
      
      <Field label="Gender">
        <SelectField value={form.gender} onChange={(value) => setField('gender', typeof value === 'object' ? value.target.value : value)}>
          <option value="">Select Gender</option>
          <option value="Male" key="gender-male">Male</option>
          <option value="Female" key="gender-female">Female</option>
          <option value="Other" key="gender-other">Other</option>
        </SelectField>
      </Field>

      <Field label="Date of birth">
        <Input type="date" className="h-10" value={form.dob} onChange={(e) => setField('dob', e.target.value)} />
      </Field>

      <Field label="Blood group">
        <SelectField value={form.blood_group} onChange={(value) => setField('blood_group', typeof value === 'object' ? value.target.value : value)}>
          <option value="">Select Blood Group</option>
          <option value="A+" key="bg-a+">A+</option>
          <option value="A-" key="bg-a-">A-</option>
          <option value="B+" key="bg-b+">B+</option>
          <option value="B-" key="bg-b-">B-</option>
          <option value="O+" key="bg-o+">O+</option>
          <option value="O-" key="bg-o-">O-</option>
          <option value="AB+" key="bg-ab+">AB+</option>
          <option value="AB-" key="bg-ab-">AB-</option>
        </SelectField>
      </Field>

      <Field label="Password">
        <Input type="password" className="h-10" value={form.password} onChange={(e) => setField('password', e.target.value)} placeholder="••••••••" />
      </Field>
    </FormSection>

    <FormSection title="Enrollment" description="The backend stores class and roll values as strings" columns={2}>
      <Field label="Roll number">
        <Input className="h-10" value={form.roll_number} onChange={(e) => setField('roll_number', e.target.value)} placeholder="e.g. 101" />
      </Field>
      <Field label="Class name" required error={errors.class_name}>
        <SelectField value={form.class_name} onChange={(value) => setField('class_name', typeof value === 'object' ? value.target.value : value)} placeholder="Select Class">
          <option value="">Select Class</option>
          {classOptions.map((option, index) => (
            <option key={`class-${index}-${option.value}`} value={option.value}>{option.label}</option>
          ))}
        </SelectField>
      </Field>

      <Field label="Section">
        <SelectField value={form.section} onChange={(value) => setField('section', typeof value === 'object' ? value.target.value : value)}>
          <option value="">Select Section</option>
          {sectionOptions.map((option, index) => (
            <option key={`section-${index}-${option.value}`} value={option.value}>{option.label}</option>
          ))}
        </SelectField>
      </Field>

      <Field label="Admission date">
        <Input type="date" className="h-10" value={form.admission_date} onChange={(e) => setField('admission_date', e.target.value)} />
      </Field>

      <Field label="Category">
        <SelectField value={form.category} onChange={(value) => setField('category', typeof value === 'object' ? value.target.value : value)}>
          <option value="">Select Category</option>
          <option value="General">General</option>
          <option value="OBC">OBC</option>
          <option value="SC">SC</option>
          <option value="ST">ST</option>
          <option value="Other">Other</option>
        </SelectField>
      </Field>

      <Field label="House">
        <SelectField value={form.house} onChange={(value) => setField('house', typeof value === 'object' ? value.target.value : value)}>
          <option value="">Select House</option>
          <option value="Red">Red</option>
          <option value="Blue">Blue</option>
          <option value="Green">Green</option>
          <option value="Yellow">Yellow</option>
        </SelectField>
      </Field>

      <Field label="Religion">
        <SelectField value={form.religion} onChange={(value) => setField('religion', typeof value === 'object' ? value.target.value : value)}>
          <option value="">Select Religion</option>
          <option value="Hinduism">Hinduism</option>
          <option value="Islam">Islam</option>
          <option value="Christianity">Christianity</option>
          <option value="Sikhism">Sikhism</option>
          <option value="Buddhism">Buddhism</option>
          <option value="Jainism">Jainism</option>
          <option value="Other">Other</option>
        </SelectField>
      </Field>

      <Field label="Caste">
        <Input className="h-10" value={form.caste} onChange={(e) => setField('caste', e.target.value)} placeholder="Sub-caste or category" />
      </Field>
      <Field label="Height">
        <Input type="number" className="h-10" value={form.height} onChange={(e) => setField('height', e.target.value)} placeholder="in cm" />
      </Field>
      <Field label="Weight">
        <Input type="number" className="h-10" value={form.weight} onChange={(e) => setField('weight', e.target.value)} placeholder="in kg" />
      </Field>

      <Field label="Status">
        <SelectField value={form.status} onChange={(value) => setField('status', typeof value === 'object' ? value.target.value : value)}>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="disabled">Disabled</option>
        </SelectField>
      </Field>
    </FormSection>

    <FormSection title="Guardian" description="Nested guardian fields supported by the backend" columns={2}>
      <Field label="Name">
        <Input className="h-10" value={form.guardian.name} onChange={(e) => setNested('guardian', 'name', e.target.value)} placeholder="Guardian full name" />
      </Field>

      <Field label="Relation">
        <SelectField value={form.guardian.relation} onChange={(value) => setNested('guardian', 'relation', typeof value === 'object' ? value.target.value : value)}>
          <option value="">Select Relation</option>
          <option value="Father">Father</option>
          <option value="Mother">Mother</option>
          <option value="Guardian">Guardian</option>
          <option value="Other">Other</option>
        </SelectField>
      </Field>

      <Field label="Phone">
        <Input className="h-10" value={form.guardian.phone} onChange={(e) => setNested('guardian', 'phone', e.target.value)} placeholder="+91 9876543210" />
      </Field>
      <Field label="Email">
        <Input type="email" className="h-10" value={form.guardian.email} onChange={(e) => setNested('guardian', 'email', e.target.value)} placeholder="guardian@email.com" />
      </Field>
      <Field label="Occupation">
        <Input className="h-10" value={form.guardian.occupation} onChange={(e) => setNested('guardian', 'occupation', e.target.value)} placeholder="e.g. Business / Service" />
      </Field>

      <div className="sm:col-span-2">
        <Field label="Address">
          <Textarea className="min-h-[80px]" value={form.guardian.address} onChange={(e) => setNested('guardian', 'address', e.target.value)} rows={3} placeholder="Full residential address" />
        </Field>
      </div>
    </FormSection>

    <FormSection title="Transport and hostel references" columns={2}>
      <Field label="Transport route">
        <SelectField value={form.transport.route_id} onChange={(value) => setNested('transport', 'route_id', typeof value === 'object' ? value.target.value : value)} placeholder="Select Route">
          <option value="">Select Route</option>
          {routeOptions.map((option, index) => (
            <option key={`route-${index}-${option.value}`} value={option.value}>{option.label}</option>
          ))}
        </SelectField>
      </Field>
      <Field label="Pickup point">
        <Input className="h-10" value={form.transport.pickup_point} onChange={(e) => setNested('transport', 'pickup_point', e.target.value)} placeholder="Stop name / location" />
      </Field>
      <Field label="Monthly transport fees">
        <Input className="h-10" value={form.transport.fees_month} onChange={(e) => setNested('transport', 'fees_month', e.target.value)} placeholder="Amount in ₹" />
      </Field>
      <Field label="Hostel">
        <SelectField value={form.hostel.hostel_id} onChange={(value) => setNested('hostel', 'hostel_id', typeof value === 'object' ? value.target.value : value)} placeholder="Select Hostel">
          <option value="">Select Hostel</option>
          {hostelOptions.map((option, index) => (
            <option key={`hostel-${index}-${option.value}`} value={option.value}>{option.label}</option>
          ))}
        </SelectField>
      </Field>
      <Field label="Room number">
        <Input className="h-10" value={form.hostel.room_no} onChange={(e) => setNested('hostel', 'room_no', e.target.value)} placeholder="e.g. 204" />
      </Field>
    </FormSection>

    <FormSection title="Files" description="The create route accepts Cloudinary uploads" columns={2}>
      <Field label="Student photo">
        <Input type="file" accept="image/*" className="h-10" onChange={(e) => setField('student_photo', e.target.files?.[0] || null)} />
      </Field>
      <Field label="Guardian photo">
        <Input type="file" accept="image/*" className="h-10" onChange={(e) => setField('guardian_photo', e.target.files?.[0] || null)} />
      </Field>
      <div className="sm:col-span-2">
        <Field label="Documents">
          <Input type="file" className="h-10" onChange={(e) => setField('documents', e.target.files?.[0] || null)} />
        </Field>
      </div>
    </FormSection>

    <button type="submit" disabled={submitting} className="hidden" aria-hidden="true">Submit</button>
  </form>
)
}

export default StudentForm

export function getStudentName(student) {
  return fullName(student?.name)
}
