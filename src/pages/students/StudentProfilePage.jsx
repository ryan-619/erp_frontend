import {
  ArrowLeft,
  Pencil,
  Printer,
  User,
  Phone,
  Mail,
  Calendar,
  GraduationCap,
  Heart,
  Bus,
  Building2,
  FileText,
  AlertTriangle,
} from "lucide-react";

import { Link, useParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import Breadcrumbs from "@/components/breadcrumbs/Breadcrumbs";
import StatusBadge from "@/components/StatusBadge";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { NoData } from "@/components/NoData";

import { useAsyncData } from "@/hooks/useAsyncData";
import { studentService } from "@/services/student.service";

import {
  formatDate,
  fullName,
  initials,
} from "@/utils/format";


const Field = ({ icon: Icon, label, value }) => {
  if (
    value === undefined ||
    value === null ||
    value === ""
  )
    return null;

  return (
    <div className="rounded-xl border bg-background p-4 transition-all hover:shadow-md">
      <div className="mb-2 flex items-center gap-2 text-muted-foreground">
        {Icon && <Icon className="h-4 w-4 text-primary" />}
        <span className="text-xs font-semibold uppercase tracking-wide">
          {label}
        </span>
      </div>

      <div className="text-sm font-semibold break-words">
        {value}
      </div>
    </div>
  );
};

function ProfileCard({ title, icon: Icon, children }) {
  return (
    <Card className="border-0 shadow-sm hover:shadow-md transition-all">
      <CardHeader className="border-b bg-muted/20">
        <CardTitle className="flex items-center gap-2 text-lg">
          {Icon && (
            <Icon className="h-5 w-5 text-primary" />
          )}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <dl className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {children}
        </dl>
      </CardContent>
    </Card>
  )
}

function PersonalInfoCard({ student }) {
  return (
    <ProfileCard title="Personal Information" icon={User}>
      <Field icon={User} label="First Name" value={student.name?.first} />
      <Field icon={User} label="Last Name" value={student.name?.last} />
      <Field icon={User} label="Gender" value={student.gender} />
      <Field icon={Calendar} label="Date of Birth" value={formatDate(student.dob)} />
      <Field icon={Heart} label="Blood Group" value={student.blood_group} />
      <Field label="Religion" value={student.religion} />
      <Field label="Category" value={student.category?.category_name || student.category?.name || student.category} />
      <Field label="House" value={student.house?.house_name || student.house?.name || student.house} />
      <Field label="Caste" value={student.caste} />
      <Field label="Height" value={student.height} />
      <Field label="Weight" value={student.weight} />
    </ProfileCard>
  )
}

function AcademicInfoCard({ student }) {
  return (
    <ProfileCard title="Academic Information" icon={GraduationCap}>
      <Field label="Roll Number" value={student.roll_number} />
      <Field label="Class" value={student.class_name} />
      <Field label="Section" value={student.section} />
      <Field label="Admission Date" value={formatDate(student.admission_date)} />
      <Field label="Status" value={<StatusBadge status={student.status || "active"} />} />
      <Field label="Email" value={student.email} />
      <Field label="Mobile" value={student.mobile} />
    </ProfileCard>
  )
}

function GuardianInfoCard({ guardian }) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5 text-primary"/>
          Guardian Information
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="mb-6 flex items-center gap-5 rounded-xl border bg-muted/30 p-5">
          {guardian.photo ? (
            <img src={guardian.photo} alt={guardian.name} className="h-24 w-24 rounded-xl object-cover shadow" />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-xl bg-primary text-3xl font-bold text-primary-foreground">
              {guardian.name?.charAt(0) || "G"}
            </div>
          )}
          <div className="flex-1">
            <h3 className="text-xl font-semibold">{guardian.name || "Guardian"}</h3>
            <p className="text-muted-foreground">{guardian.relation}</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Field icon={Phone} label="Phone" value={guardian.phone} />
          <Field icon={Mail} label="Email" value={guardian.email} />
          <Field label="Occupation" value={guardian.occupation} />
          <Field label="Address" value={guardian.address} />
        </div>
      </CardContent>
    </Card>
  )
}

function TransportInfoCard({ transport }) {
  return (
    <ProfileCard title="Transport Information" icon={Bus}>
      <Field label="Route" value={transport.route_name || transport.route?.name || transport.route_id?.route_name} />
      <Field label="Pickup point" value={transport.pickup_point} />
      <Field label="Monthly fees" value={transport.fees_month ? `₹ ${transport.fees_month}` : ""} />
      <Field label="Vehicle" value={transport.vehicle_name} />
    </ProfileCard>
  )
}

function HostelInfoCard({ hostel }) {
  return (
    <ProfileCard title="Hostel Information" icon={Building2}>
      <Field label="Room number" value={hostel.room_no} />
    </ProfileCard>
  )
}

function DocumentsCard({ documents }) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Documents
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <Button variant="outline" className="w-full mt-3" asChild>
          <a href={documents} target="_blank" rel="noreferrer">
            View Document
          </a>
        </Button>
      </CardContent>
    </Card>
  )
}




export default function StudentProfilePage() {
  const { id } = useParams()
  const { data: student, isLoading, error, refetch } = useAsyncData(() => studentService.get(id), [id])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Students', to: '/students' }, { label: 'Profile' }]} />
        <LoadingSkeleton variant="table" rows={8} cols={2} />
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="space-y-6">
        <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Students', to: '/students' }, { label: 'Profile' }]} />
        <NoData
          title={error?.status === 404 ? 'Student not found' : error?.status === 400 ? 'Invalid student ID' : 'Unable to load student'}
          description={error?.message || 'The requested student record is unavailable.'}
          actionLabel="Try again"
          onAction={refetch}
          icon={AlertTriangle}
        />
      </div>
    );
  }

  const guardian = student.guardian || {}

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Students', to: '/students' }, { label: 'Profile' }]} />
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/students">
            <ArrowLeft className="mr-2 h-4 w-4"/>
            Back to Students
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Student Profile</h1>
          <p className="text-muted-foreground">Complete student information and records</p>
        </div>
      </div>
      
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="sticky top-6 overflow-hidden border-0 shadow-lg">
          <div className="h-28 bg-gradient-to-r from-primary via-primary/90 to-indigo-500" />
          <CardContent className="-mt-16 p-6">
            <div className="flex flex-col items-center">
              {student.files?.student_photo ? (
                <img
                  src={student.files.student_photo}
                  alt={fullName(student.name)}
                  className="h-36 w-36 rounded-2xl border-4 border-background object-cover shadow-xl transition-transform duration-300 hover:scale-105"
                />
              ) : (
                <div className="flex h-36 w-36 items-center justify-center rounded-2xl border-4 border-background bg-primary text-5xl font-bold text-white shadow-xl">
                  {initials(student.name)}
                </div>
              )}
              <h2 className="mt-5 text-2xl font-bold">{fullName(student.name)}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{student.email}</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <StatusBadge status={student.status || "active"} />
                {student.class_name && <Badge variant="secondary">{student.class_name}</Badge>}
                {student.section && <Badge variant="outline">Section {student.section}</Badge>}
              </div>
            </div>
            <div className="mt-8 space-y-4">
              <Field icon={GraduationCap} label="Roll Number" value={student.roll_number} />
              <Field icon={User} label="Gender" value={student.gender} />
              <Field icon={Calendar} label="Date of Birth" value={formatDate(student.dob)} />
              <Field icon={Phone} label="Mobile" value={student.mobile} />
              <Field icon={Mail} label="Email" value={student.email} />
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button variant="outline" onClick={() => window.print()}><Printer className="mr-2 h-4 w-4"/>Print</Button>
            </div>
          </CardContent>
        </Card>
        
        <div className="space-y-6 lg:col-span-2">
          <PersonalInfoCard student={student} />
          <AcademicInfoCard student={student} />
          <GuardianInfoCard guardian={guardian} />
          {student.transport && Object.keys(student.transport).length > 0 && <TransportInfoCard transport={student.transport} />}
          {student.hostel && Object.keys(student.hostel).length > 0 && <HostelInfoCard hostel={student.hostel} />}
          {student.files?.documents && <DocumentsCard documents={student.files.documents} />}
        </div>
      </div>
    </div>
  )
}
