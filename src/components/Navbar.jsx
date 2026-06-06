import { Link, useNavigate, useLocation } from 'react-router-dom'
import logo from '../assets/logo.png'

export default function Navbar() {
  const navigate = useNavigate()
  useLocation() // re-render przy każdej zmianie trasy
  const username = localStorage.getItem('username')

  function handleLogout() {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('username')
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

        {username ? (
          <div className="flex items-center gap-3">
            <Link
              to="/account"
              className="text-sm text-gray-300 hover:text-white transition-colors"
            >
              {username}
            </Link>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 px-4 py-1.5 rounded text-sm transition-colors"
            >
              Logout
            </button>
          </div>
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
