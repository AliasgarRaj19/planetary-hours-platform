import { Navigate, Route, Routes } from 'react-router-dom'
import { RequireAuth } from './auth/RequireAuth'
import { Layout } from './components/Layout'
import { PlanetaryHoursPage } from './features/planetary-hours/PlanetaryHoursPage'
import { BlogArticleEditorPage } from './features/blog/BlogArticleEditorPage'
import { BlogArticlesPage } from './features/blog/BlogArticlesPage'
import { BlogCategoriesPage } from './features/blog/BlogCategoriesPage'
import { AnalyticsPage } from './pages/AnalyticsPage'
import { DashboardPage } from './pages/DashboardPage'
import { LoginPage } from './pages/LoginPage'
import { NotificationsPage } from './pages/NotificationsPage'
import { SettingsPage } from './pages/SettingsPage'
import { SystemLogsPage } from './pages/SystemLogsPage'
import './App.css'

function App() {
  return (
    <Routes>
      <Route path="login" element={<LoginPage />} />
      <Route element={<RequireAuth />}>
        <Route element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="planetary-hours" element={<PlanetaryHoursPage />} />
          <Route path="blog" element={<BlogArticlesPage />} />
          <Route path="blog/new" element={<BlogArticleEditorPage />} />
          <Route path="blog/:id" element={<BlogArticleEditorPage />} />
          <Route path="blog/categories" element={<BlogCategoriesPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="system-logs" element={<SystemLogsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default App
