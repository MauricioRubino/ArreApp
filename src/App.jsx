import { Routes, Route } from 'react-router-dom'
import Header from './components/layout/Header'
import HomePage from './pages/HomePage'
import CartaPage from './pages/CartaPage'
import DeliveryPage from './pages/DeliveryPage'
import ReservasPage from './pages/ReservasPage'

export default function App() {
  return (
    <div className="min-h-screen bg-crema">
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/carta" element={<CartaPage />} />
        <Route path="/delivery" element={<DeliveryPage />} />
        <Route path="/reservas" element={<ReservasPage />} />
      </Routes>
    </div>
  )
}
