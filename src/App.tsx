import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AuthProvider } from './context/AuthContext'
import { StudentProvider } from './context/StudentContext'
import { CabinetPage } from './pages/CabinetPage'
import { GoalsPage } from './pages/GoalsPage'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { PracticePage } from './pages/PracticePage'
import { TheoryModulePage } from './pages/TheoryModulePage'
import { TheoryPage } from './pages/TheoryPage'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
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
              <Route path="cabinet" element={<CabinetPage />} />
              <Route path="goals" element={<GoalsPage />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
