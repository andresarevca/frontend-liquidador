import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { AuthenticatedLayout } from './layouts/AuthenticatedLayout'
import { AuthPage } from './pages/AuthPage'
import { DashboardPage } from './pages/DashboardPage'
import { CarpetaListPage } from './pages/CarpetaListPage'
import { CarpetaDetailPage } from './pages/CarpetaDetailPage'
import { DocumentosPage } from './pages/DocumentosPage'
import { CorpusLegalPage } from './pages/CorpusLegalPage'
import { ConfiguracionPage } from './pages/ConfiguracionPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route element={<AuthenticatedLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/casos" element={<CarpetaListPage />} />
          <Route path="/casos/:id" element={<CarpetaDetailPage />} />
          <Route path="/documentos" element={<DocumentosPage />} />
          <Route path="/corpus" element={<CorpusLegalPage />} />
          <Route path="/configuracion" element={<ConfiguracionPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
