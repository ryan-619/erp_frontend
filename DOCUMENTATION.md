# ERP_FRONTEND - Documentation

**Version:** 0.1  
**Status:** Active Development - Frontend Complete, Backend Integration In Progress

---

## Folder Structure

```
erp_frontend/
├── src/
│   ├── app/              # App.jsx, providers.jsx, router.jsx
│   ├── components/       # Reusable components (ui/, DataTable/, StatCard/, etc.)
│   ├── config/           # sidebar.js
│   ├── constants/        # app.js, navigation.js
│   ├── context/          # AuthContext.jsx, ThemeContext.jsx
│   ├── data/             # Mock data files (23 modules)
│   ├── hooks/            # Custom hooks (useAsyncData, useStudents, etc.)
│   ├── layouts/          # AppLayout.jsx, AuthLayout.jsx
│   ├── lib/              # utils.js
│   ├── pages/            # Page components (23 modules)
│   ├── routes/           # ProtectedRoute.jsx, PublicRoute.jsx
│   ├── services/         # Service layer (25 services)
│   ├── styles/           # index.css
│   └── utils/            # format.js, export.js
```

---

## Technology Stack

- React 19.2.7, Vite 8.1.1
- React Router DOM 7.18.1
- Tailwind CSS 3.4.19, Radix UI
- Axios 1.18.1, React Hook Form 7.81.0, Zod 4.4.3
- @tanstack/react-table 8.21.3, Recharts 3.9.2
- Lucide React 1.24.0, date-fns 4.4.0

---

## Architecture

**Layers:**
- Presentation: Pages, Components
- Business Logic: Custom Hooks, Context Providers
- Service Layer: API Clients
- Data Layer: Mock Data (backend integration in progress)

**State Management:**
- Local: useState, useEffect
- Global: AuthContext, ThemeContext
- Server: useAsyncData hook

---

## Key Components

- **DataTable** - Sortable table with pagination, selection, export
- **StatCard** - KPI display with trend
- **PageHeader** - Page title and actions
- **SearchBar** - Search with debouncing
- **Drawer** - Slide-over forms
- **DeleteDialog** - Delete confirmation

---

## Authentication

**AuthContext** (`src/context/AuthContext.jsx`)
- Session stored in localStorage
- login(), logout() methods
- Currently uses mock data

**Backend Integration:**
- Will use JWT tokens
- POST /auth/login, POST /auth/logout

---

## Routing

**Router** (`src/app/router.jsx`)
- Lazy loading for all pages
- ProtectedRoute for authenticated pages
- PublicRoute for login page
- Error routes (403, 404)

---

## Services

All services follow this pattern:
```javascript
export const moduleService = {
  async list(params = {}) { },
  async get(id) { },
  async create(payload) { },
  async update(id, payload) { },
  async remove(id) { },
}
```

**Available:** student, academics, attendance, examination, fees, hr, library, transport, hostel, inventory, onlineExam, frontOffice, downloadCenter, homework, lessonPlan, alumni, income, expenses, school, college, domain, users, auth

**API Client** (`src/services/api.js`)
- Axios with 15s timeout
- JWT token in headers
- Auto-clear session on 401

---

## Modules

**Implemented:**
- Dashboard, Students, Academics, Attendance, Examination, Fees, HR, Library, Transport, Hostel, Front Office, Inventory, Online Exam, Download Center, Homework, Lesson Plan, Alumni, Income, Expenses, Users, Schools, Colleges, Domains, Settings, Profile

**Planned:**
- Reports, Notifications, Communication, Certificates, Analytics, Audit Logs, Activity Timeline, Role Permissions, System Logs

---

## Development

**Commands:**
```bash
npm install
npm run dev      # http://localhost:5173
npm run build
npm run lint
```

**Add Module:**
1. Create pages in `src/pages/module/`
2. Create service in `src/services/module.service.js`
3. Create mock data in `src/data/module.mock.js`
4. Add route in `src/app/router.jsx`
5. Add navigation in `src/config/sidebar.js`

---

## Current Status

**Completed:**
- All module pages with UI
- Shared component library
- Mock service layer
- Theme system
- Route guards

**In Progress:**
- Backend API integration
- JWT authentication
- Data validation

**Planned:**
- React Query integration
- Role-based access control
- Testing
- Production deployment

---

## Future Roadmap

- Backend API integration (replace mock data)
- JWT authentication with token refresh
- Role-based access control
- React Query for caching
- Performance optimization
- Testing (unit, integration, E2E)
- Production deployment
- New modules (Reports, Notifications, etc.)
- WebSocket notifications
- Audit logging

---

**End**