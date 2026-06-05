import { Link } from 'react-router-dom'
import tspImg from '../assets/TSP.png'
import vrpImg from '../assets/VRP.png'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero */}
      <div className="bg-gray-900 text-white text-center py-20 px-6">
        <h1 className="text-5xl font-bold mb-4">GeoPlanner</h1>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8">
          Plan smarter routes. Geocode addresses, solve Travelling Salesman
          and Vehicle Routing problems — all in one place.
        </p>
        <div className="flex justify-center gap-4">
          <Link to="/login" className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-semibold transition-colors">
            Get Started
          </Link>
          <Link to="/geocoding" className="border border-white hover:bg-white hover:text-gray-900 px-6 py-3 rounded-lg font-semibold transition-colors">
            Try Geocoding
          </Link>
        </div>
      </div>

      {/* Feature cards */}
      <div className="max-w-5xl mx-auto px-6 py-16 grid md:grid-cols-3 gap-8">

        {/* Geocoding */}
        <div className="bg-white rounded-xl shadow p-6 text-center">
          <div className="text-4xl mb-4">📍</div>
          <h2 className="text-xl font-bold mb-3">Geocoding</h2>
          <p className="text-gray-600 text-sm">
            Import a list of addresses and automatically find their coordinates
            using OpenStreetMap. Save results as depots or delivery jobs.
          </p>
          <Link to="/geocoding" className="mt-4 inline-block text-green-600 hover:underline font-medium">
            Try it →
          </Link>
        </div>

        {/* TSP */}
        <div className="bg-white rounded-xl shadow p-6 text-center">
          <img src={tspImg} alt="TSP" className="w-32 h-32 object-contain mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-3">TSP</h2>
          <p className="text-gray-600 text-sm">
            The Travelling Salesman Problem: given a list of locations, what is the
            shortest route that visits each exactly once and returns to the start?
            Solved using Google OR-Tools.
          </p>
          <Link to="/tsp" className="mt-4 inline-block text-green-600 hover:underline font-medium">
            Plan a route →
          </Link>
        </div>

        {/* VRP */}
        <div className="bg-white rounded-xl shadow p-6 text-center">
          <img src={vrpImg} alt="VRP" className="w-32 h-32 object-contain mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-3">VRP</h2>
          <p className="text-gray-600 text-sm">
            The Vehicle Routing Problem: what is the optimal set of routes for a
            fleet of vehicles to deliver to a set of customers?
            Assign jobs to vehicles efficiently.
          </p>
          <Link to="/vrp" className="mt-4 inline-block text-green-600 hover:underline font-medium">
            Optimize fleet →
          </Link>
        </div>
      </div>
    </div>
  )
}
