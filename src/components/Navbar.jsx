import { Link, useNavigate } from 'react-router-dom'
import logo from '../assets/logo.png'

export default function Navbar() {
  const navigate = useNavigate()
  const token = localStorage.getItem('access_token')

  function handleLogout() {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    navigate('/')
  }

  return (
    <nav className="sticky top-0 z-50 bg-gray-900 text-white px-6 py-3 flex items-center justify-between">
      <Link to="/" className="flex items-center gap-2 font-bold text-lg">
        <img src={logo} alt="logo" className="w-7 h-7" />
        GeoPlanner
      </Link>

      <div className="flex items-center gap-6">
        <Link to="/geocoding" className="hover:text-green-400 transition-colors">Geocoding</Link>
        <Link to="/tsp" className="hover:text-green-400 transition-colors">TSP</Link>
        <Link to="/vrp" className="hover:text-green-400 transition-colors">VRP</Link>

        {token ? (
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 px-4 py-1.5 rounded transition-colors"
          >
            Logout
          </button>
        ) : (
          <Link
            to="/login"
            className="bg-green-600 hover:bg-green-700 px-4 py-1.5 rounded transition-colors"
          >
            Login
          </Link>
        )}
      </div>
    </nav>
  )
}
