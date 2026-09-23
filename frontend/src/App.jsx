import { HashRouter, Route, Routes } from 'react-router-dom'
import Layout from '@/components/Layout'
import { Toaster } from '@/components/ui/sonner'
import Inventory from '@/pages/Inventory'
import POS from '@/pages/POS'
import Reports from '@/pages/Reports'
import Settings from '@/pages/Settings'

function App() {
  return (
    <HashRouter>
      <Toaster />
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Inventory />} />
          <Route path="pos" element={<POS />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}

export default App
