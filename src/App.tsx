import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { ProtectedRoute, RoleGate } from './components/ProtectedRoute'
import { TeacherLayout } from './components/TeacherLayout'
import { AuthProvider } from './context/AuthContext'
import { StudentProvider } from './context/StudentContext'
import { CabinetPage } from './pages/CabinetPage'
import { FlashcardsPage } from './pages/FlashcardsPage'
import { GoalsPage } from './pages/GoalsPage'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { PracticePage } from './pages/PracticePage'
import { TaskSessionRoute } from './pages/TaskSessionPage'
import { TheoryModulePage } from './pages/TheoryModulePage'
import { TheoryPage } from './pages/TheoryPage'
import { TeacherDashboardPage } from './pages/teacher/TeacherDashboardPage'
import { TeacherFeedPage } from './pages/teacher/TeacherFeedPage'
import { TeacherStudentPage } from './pages/teacher/TeacherStudentPage'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter basename={(import.meta.env.BASE_URL ?? '/').replace(/\/$/, '')}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<RoleGate role="teacher" />}>
              <Route path="teacher" element={<TeacherLayout />}>
                <Route index element={<TeacherDashboardPage />} />
                <Route path="students/:studentId" element={<TeacherStudentPage />} />
                <Route path="feed" element={<TeacherFeedPage />} />
              </Route>
            </Route>
            <Route element={<RoleGate role="student" />}>
            <Route
              element={
                <StudentProvider>
                  <Layout />
                </StudentProvider>
              }
            >
              <Route index element={<HomePage />} />
              <Route path="theory" element={<TheoryPage />} />
              <Route path="theory/:moduleId" element={<TheoryModulePage />} />
              <Route path="practice" element={<PracticePage />} />
              <Route path="practice/cards/:moduleId" element={<FlashcardsPage />} />
              <Route path="practice/session" element={<TaskSessionRoute />} />
              <Route path="cabinet" element={<CabinetPage />} />
              <Route path="goals" element={<GoalsPage />} />
            </Route>
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
