import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { CarpetaListPage } from './pages/CarpetaListPage'
import { CarpetaDetailPage } from './pages/CarpetaDetailPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CarpetaListPage />} />
        <Route path="/carpetas/:id" element={<CarpetaDetailPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
