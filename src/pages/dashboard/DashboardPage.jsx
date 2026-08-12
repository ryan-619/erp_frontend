// // ====================================================================
// // Module: Dashboard
// // Page: Dashboard
// //
// // Purpose:
// // Central hub showing school-wide stats and quick links.
// //
// // Data Source:
// // mockData.js (mock)
// //
// // Backend:
// // APIs should always be called through the service layer.
// // Never call Axios directly from this page.
// // ====================================================================

// import { useMemo } from 'react'
// import { Link } from 'react-router-dom'
// import {
//   Building2,
//   GraduationCap,
//   School,
//   UserPlus,
//   Users,
//   Activity,
//   Globe,
//   TrendingUp,
//   ArrowRight,
// } from 'lucide-react'
// import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
// import { Button } from '@/components/ui/button'
// import Breadcrumbs from '@/components/breadcrumbs/Breadcrumbs'
// import PageHeader from '@/components/PageHeader'
// import KpiCard from '@/components/cards/KpiCard'
// import KpiSkeleton from '@/components/loaders/KpiSkeleton'
// import ChartCard from '@/components/charts/ChartCard'
// import TrendAreaChart from '@/components/charts/TrendAreaChart'
// import BarChartCard from '@/components/charts/BarChartCard'
// import DonutChart from '@/components/charts/DonutChart'
// import { useAsyncData } from '@/hooks/useAsyncData'
// // import { activities } from '@/services/mockData'
// // import { mockResponse } from '@/services/mockData'
// import { formatRelativeTime } from '@/utils/format'

// const ACTIVITY_ICONS = {
//   student: GraduationCap,
//   school: School,
//   college: Building2,
//   user: Users,
//   domain: Globe,
// }

// // INTEGRATION: replace this mock fetcher with a dashboard service call.
// function fetchDashboard() {
// //   return mockResponse({
// //     kpis: [
// //       { id: 'students', label: 'Total Students', value: 48230, trend: 12.5, icon: 'GraduationCap', accent: 'primary' },
// //       { id: 'institutions', label: 'Institutions', value: 1240, trend: 4.2, icon: 'Building2', accent: 'chart4' },
// //       { id: 'users', label: 'Active Users', value: 8640, trend: 8.1, icon: 'Users', accent: 'chart2' },
// //       { id: 'admissions', label: 'Pending Admissions', value: 318, trend: -2.3, icon: 'UserPlus', accent: 'warning' },
// //     ],
// //     enrollment: [
// //       { label: 'Jan', value: 3200 }, { label: 'Feb', value: 4100 }, { label: 'Mar', value: 3800 },
// //       { label: 'Apr', value: 5200 }, { label: 'May', value: 4900 }, { label: 'Jun', value: 6100 },
// //       { label: 'Jul', value: 5600 }, { label: 'Aug', value: 7200 },
// //     ],
// //     institutions: [
// //       { label: 'Lincoln', value: 1240 }, { label: 'Riverside', value: 860 },
// //       { label: 'Greenwood', value: 2100 }, { label: 'Oakridge', value: 1820 },
// //       { label: 'Westfield', value: 5400 }, { label: 'Northgate', value: 8200 },
// //     ],
// //     distribution: [
// //       { label: 'Schools', value: 620, color: 'chart-1' },
// //       { label: 'Colleges', value: 410, color: 'chart-2' },
// //       { label: 'Training', value: 210, color: 'chart-3' },
// //     ],
// //   })
// }

// const QUICK_ACTIONS = [
//   { title: 'Add School', to: '/schools', icon: School, desc: 'Onboard a new school' },
//   { title: 'Enroll Student', to: '/students/admissions', icon: GraduationCap, desc: 'New admission' },
//   { title: 'Invite User', to: '/users', icon: UserPlus, desc: 'Send an invite' },
//   { title: 'Add Domain', to: '/domains', icon: Globe, desc: 'Register a domain' },
// ]

// export default function DashboardPage() {
//   const { data, isLoading } = useAsyncData(fetchDashboard, [])

//   const kpis = data?.kpis || []
//   const iconMap = { GraduationCap, Building2, Users, UserPlus }

//   return (
//     <div className="space-y-6 animate-fade-in">
//       <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Dashboard' }]} />
//       <PageHeader
//         title="Dashboard"
//         description="Executive overview of institutions, students, and platform activity."
//         actions={
//           <Button asChild>
//             <Link to="/schools">
//               <Building2 className="mr-2 h-4 w-4" /> Manage Institutions
//             </Link>
//           </Button>
//         }
//       />

//       {/* KPI row */}
//       <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
//         {isLoading
//           ? Array.from({ length: 4 }).map((_, i) => <KpiSkeleton key={i} />)
//           : kpis.map((kpi) => (
//               <KpiCard
//                 key={kpi.id}
//                 label={kpi.label}
//                 value={kpi.value}
//                 icon={iconMap[kpi.icon]}
//                 trend={kpi.trend}
//                 trendLabel="vs last month"
//                 accent={kpi.accent}
//               />
//             ))}
//       </div>

//       {/* Charts row */}
//       <div className="grid gap-4 lg:grid-cols-3">
//         <ChartCard
//           className="lg:col-span-2"
//           title="Student Enrollment"
//           description="Monthly new enrollments across all institutions"
//           action={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
//         >
//           {isLoading ? <div className="h-[260px]" /> : <TrendAreaChart data={data.enrollment} color="chart-1" />}
//         </ChartCard>

//         <ChartCard
//           title="Institution Mix"
//           description="Distribution by type"
//         >
//           {isLoading ? <div className="h-[260px]" /> : <DonutChart data={data.distribution} />}
//         </ChartCard>
//       </div>

//       <div className="grid gap-4 lg:grid-cols-3">
//         <ChartCard
//           className="lg:col-span-2"
//           title="Students by Institution"
//           description="Top institutions by enrolled students"
//         >
//           {isLoading ? <div className="h-[260px]" /> : <BarChartCard data={data.institutions} color="chart-2" />}
//         </ChartCard>

//         {/* Recent activity */}
//         <Card>
//           <CardHeader>
//             <CardTitle className="text-base">Recent Activity</CardTitle>
//             <CardDescription>Latest events across the platform</CardDescription>
//           </CardHeader>
//           <CardContent className="space-y-1">
//             {activities.map((act) => {
//               const Icon = ACTIVITY_ICONS[act.type] || Activity
//               return (
//                 <div key={act.id} className="flex items-start gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-accent/50">
//                   <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
//                     <Icon className="h-4 w-4" />
//                   </div>
//                   <div className="min-w-0 flex-1">
//                     <p className="truncate text-sm font-medium">{act.title}</p>
//                     <p className="truncate text-xs text-muted-foreground">{act.meta}</p>
//                   </div>
//                   <span className="shrink-0 text-xs text-muted-foreground">{formatRelativeTime(act.time)}</span>
//                 </div>
//               )
//             })}
//           </CardContent>
//         </Card>
//       </div>

//       {/* Quick actions */}
//       <div>
//         <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Quick Actions</h2>
//         <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
//           {QUICK_ACTIONS.map((action) => (
//             <Link
//               key={action.title}
//               to={action.to}
//               className="group rounded-xl border bg-card p-4 shadow-sm transition-all hover:border-primary/30 hover:shadow-md"
//             >
//               <div className="flex items-center justify-between">
//                 <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
//                   <action.icon className="h-5 w-5" />
//                 </div>
//                 <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
//               </div>
//               <p className="mt-3 text-sm font-medium">{action.title}</p>
//               <p className="text-xs text-muted-foreground">{action.desc}</p>
//             </Link>
//           ))}
//         </div>
//       </div>
//     </div>
//   )
// }




export default function DashboardPage() {
  return (
    <div className="flex h-[70vh] items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="mt-2 text-muted-foreground">
          Coming Soon...
        </p>
      </div>
    </div>
  )
}