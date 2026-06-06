import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Geocoding from './pages/Geocoding'
import TSP from './pages/TSP'
import VRP from './pages/VRP'
import Account from './pages/Account'

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/geocoding" element={<Geocoding />} />
        <Route path="/tsp" element={<TSP />} />
        <Route path="/vrp" element={<VRP />} />
        <Route path="/account" element={<Account />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
