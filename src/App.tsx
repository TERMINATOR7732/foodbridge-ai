import { Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import DonateFoodPage from './pages/DonateFoodPage'
import FoodAnalysisPage from './pages/FoodAnalysisPage'
import CommunityMatchingPage from './pages/CommunityMatchingPage'
import AIAssistantPage from './pages/AIAssistantPage'
import ImpactDashboardPage from './pages/ImpactDashboardPage'
import DonationStatusPage from './pages/DonationStatusPage'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/donate" element={<DonateFoodPage />} />
        <Route path="/analysis" element={<FoodAnalysisPage />} />
        <Route path="/matching" element={<CommunityMatchingPage />} />
        <Route path="/assistant" element={<AIAssistantPage />} />
        <Route path="/impact" element={<ImpactDashboardPage />} />
        <Route path="/donation-status" element={<DonationStatusPage />} />
      </Routes>
    </Layout>
  )
}

export default App
