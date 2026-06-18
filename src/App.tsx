import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import Dashboard from '@/pages/Dashboard'
import Register from '@/pages/Register'
import Assess from '@/pages/Assess'
import Conduction from '@/pages/Conduction'
import Trends from '@/pages/Trends'
import Response from '@/pages/Response'
import ThresholdSettings from '@/pages/ThresholdSettings'
import HistoricalLessons from '@/pages/HistoricalLessons'
import { useRiskStore } from '@/stores/riskStore'
import { useEffect } from 'react'

function AppLayout() {
  const initialize = useRiskStore((s) => s.initialize)

  useEffect(() => {
    initialize()
  }, [initialize])

  return (
    <div className="flex h-screen w-full overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden ml-[240px]">
        <Header />
        <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/register" element={<Register />} />
            <Route path="/assess" element={<Assess />} />
            <Route path="/assess/:id" element={<Assess />} />
            <Route path="/conduction" element={<Conduction />} />
            <Route path="/trends" element={<Trends />} />
            <Route path="/response" element={<Response />} />
            <Route path="/thresholds" element={<ThresholdSettings />} />
            <Route path="/lessons" element={<HistoricalLessons />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <Router>
      <AppLayout />
    </Router>
  )
}
