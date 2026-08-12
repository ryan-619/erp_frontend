# 🎓 ERP Frontend

A modern, scalable, and enterprise-grade ERP Frontend built with **React 19**, **Vite**, **Tailwind CSS**, and **shadcn/ui**. The application is designed to work with a multi-tenant ERP backend and provides an intuitive interface for managing educational institutions.

---

## 🚀 Tech Stack

### Frontend
- React 19
- Vite 8
- React Router 7
- Tailwind CSS
- shadcn/ui
- Lucide React

### State Management
- React Context API
- TanStack React Query

### Forms & Validation
- React Hook Form
- Zod

### API & Networking
- Axios

### UI Components
- shadcn/ui
- Sonner
- Recharts

### Utilities
- date-fns
- clsx
- class-variance-authority
- tailwind-merge

---

# 📁 Project Structure

```text
src/
│
├── app/
├── assets/
├── components/
│   ├── ui/
│   ├── common/
│   ├── navbar/
│   ├── sidebar/
│   ├── cards/
│   ├── charts/
│   ├── tables/
│   ├── forms/
│   └── dialogs/
│
├── config/
├── constants/
├── context/
├── hooks/
├── layouts/
├── lib/
├── pages/
├── routes/
├── services/
├── styles/
└── utils/
```

---

# ✨ Features

- Authentication
- Role-Based Access Control (RBAC)
- Multi-Tenant Architecture
- Dashboard Analytics
- Student Management
- Staff Management
- Attendance Management
- Fee Management
- Examination Module
- Library Module
- Transport Module
- Hostel Module
- Inventory Management
- Reports & Analytics
- Responsive Design
- Dark / Light Theme
- Reusable UI Components

---

# ⚙️ Installation

Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/erp-frontend.git
```

Go to the project

```bash
cd erp-frontend
```

Install dependencies

```bash
npm install
```

Start development server

```bash
npm run dev
```

Build production

```bash
npm run build
```

Preview production build

```bash
npm run preview
```

---

# 🌍 Environment Variables

Create a `.env` file in the root directory.

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

---

# 🏗️ Architecture

```text
Browser
      │
      ▼
main.jsx
      │
      ▼
App.jsx
      │
      ▼
Providers
      │
      ▼
Router
      │
      ▼
Layouts
      │
      ▼
Pages
      │
      ▼
Components
      │
      ▼
Services
      │
      ▼
Axios
      │
      ▼
Backend API
```

---

# 📦 Major Libraries

| Library | Purpose |
|----------|---------|
| React Router | Routing |
| Axios | API Communication |
| React Query | Server State Management |
| React Hook Form | Form Handling |
| Zod | Validation |
| Tailwind CSS | Styling |
| shadcn/ui | UI Components |
| Recharts | Dashboard Charts |
| Sonner | Notifications |

---

# 🎯 Development Workflow

- Feature-based architecture
- Reusable components
- Service layer for API communication
- Protected routes
- Clean folder structure
- Responsive UI
- Scalable codebase

---

# 📌 Upcoming Modules

- Login & Authentication
- Dashboard
- School Management
- Student Management
- Staff Management
- Academics
- Attendance
- Examination
- Fees
- Library
- Transport
- Hostel
- Inventory
- Reports
- Settings

---

# 🤝 Contributing

1. Fork the repository.
2. Create a feature branch.

```bash
git checkout -b feature/your-feature-name
```

3. Commit your changes.

```bash
git commit -m "Add your feature"
```

4. Push the branch.

```bash
git push origin feature/your-feature-name
```

5. Open a Pull Request.

---

# 📄 License

This project is licensed under the MIT License.

---

## 👨‍💻 Author

**Vaishno Tiwari**

GitHub: https://github.com/Vaishnotiwari12