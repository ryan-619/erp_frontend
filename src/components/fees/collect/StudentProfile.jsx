import { Building2, Phone, GraduationCap, Mail, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/StatusBadge'

export function StudentProfile({ student }) {
  if (!student) return null
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary">
            {student.avatar}
          </div>
          <div>
            <CardTitle className="text-base">{student.name}</CardTitle>
            <p className="text-sm text-muted-foreground">{student.admission_no}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2.5 text-sm">
        <Row icon={GraduationCap} label="Class" value={`${student.class} - Section ${student.section}`} />
        <Row icon={Building2} label="School" value={student.school_name} />
        <Row icon={Users} label="Guardian" value={student.guardian_name} />
        <Row icon={Phone} label="Mobile" value={student.mobile} />
        <Row icon={Mail} label="Email" value={student.email} />
      </CardContent>
    </Card>
  )
}

function Row({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-2.5">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="text-muted-foreground">{label}:</span>
      <span className="ml-auto font-medium">{value}</span>
    </div>
  )
}

export default StudentProfile
