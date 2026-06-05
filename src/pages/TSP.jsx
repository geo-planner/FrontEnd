import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet'
import L from 'leaflet'
import api from '../api/axios'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

export default function TSP() {
  const [depots, setDepots] = useState([])
  const [jobs, setJobs] = useState([])
  const [selectedDepot, setSelectedDepot] = useState('')
  const [selectedJobs, setSelectedJobs] = useState([])
  const [routeName, setRouteName] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // pobierz depotyy i joby uzytkownika przy zaladowaniu strony
  useEffect(() => {
    api.get('/depots/').then(r => setDepots(r.data))
    api.get('/jobs/').then(r => setJobs(r.data))
  }, [])

  function toggleJob(id) {
    setSelectedJobs(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  async function handleSolve() {
    if (!selectedDepot) return setError('Select a depot first.')
    if (selectedJobs.length < 2) return setError('Select at least 2 jobs.')
    setError('')
    setLoading(true)
    setResult(null)
    try {
      // krok 1: utwórz trase
      const routeRes = await api.post('/routes/', {
        name: routeName || 'TSP Route',
        depot: selectedDepot,
        route_type: 1,   // ID = 1 to TSP (wpisane przez admin)
        route_status: 1, // ID = 1 to Draft
      })
      const routeId = routeRes.data.id

      // krok 2: rozwiaz TSP
      const solveRes = await api.post(`/routes/${routeId}/solve/`, {
        job_ids: selectedJobs,
      })
      setResult(solveRes.data)
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  // budujemy wspolrzedne trasy dla polyline: depot -> kolejne joby -> depot
  const depot = depots.find(d => d.id === parseInt(selectedDepot))
  const routePoints = result
    ? [
        [depot.latitude, depot.longitude],
        ...result.stops.map(s => [s.job_latitude, s.job_longitude]),
        [depot.latitude, depot.longitude],
      ]
    : []

  const mapCenter = depot
    ? [depot.latitude, depot.longitude]
    : [54.5, -3.5]

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-bold mb-1">TSP — Travelling Salesman Problem</h1>
      <p className="text-gray-500 text-sm mb-6">
        Select a depot and jobs, then solve to find the shortest route.
      </p>

      <div className="grid lg:grid-cols-2 gap-6">

        {/* LEWA strona — konfiguracja */}
        <div className="space-y-5">

          {/* Depot */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Depot (starting point)</label>
            <select
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              value={selectedDepot}
              onChange={e => setSelectedDepot(e.target.value)}
            >
              <option value="">— select depot —</option>
              {depots.map(d => (
                <option key={d.id} value={d.id}>{d.name} ({d.address})</option>
              ))}
            </select>
          </div>

          {/* Jobs */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Jobs to visit ({selectedJobs.length} selected)
            </label>
            <div className="border rounded-lg bg-white max-h-52 overflow-y-auto divide-y text-sm">
              {jobs.length === 0 && (
                <p className="p-3 text-gray-400">No jobs found. Add jobs via Geocoding first.</p>
              )}
              {jobs.map(j => (
                <label key={j.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedJobs.includes(j.id)}
                    onChange={() => toggleJob(j.id)}
                    disabled={!j.latitude}
                  />
                  <span className={!j.latitude ? 'text-gray-300' : ''}>
                    {j.job_code ? `[${j.job_code}] ` : ''}{j.address}
                    {!j.latitude && ' — no coordinates'}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Route name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Route name (optional)</label>
            <input
              type="text"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="e.g. Monday delivery run"
              value={routeName}
              onChange={e => setRouteName(e.target.value)}
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            onClick={handleSolve}
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-2 rounded-lg font-semibold transition-colors"
          >
            {loading ? 'Solving...' : 'Solve TSP'}
          </button>

          {/* Wyniki */}
          {result && (
            <div className="bg-white border rounded-lg overflow-hidden">
              <div className="bg-gray-100 px-4 py-2 flex justify-between items-center">
                <span className="font-semibold text-sm">Result: {result.name}</span>
                {result.total_distance_km && (
                  <span className="text-sm text-gray-500">
                    {result.total_distance_km.toFixed(1)} km
                  </span>
                )}
              </div>
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-2 text-left w-8">#</th>
                    <th className="p-2 text-left">Address</th>
                    <th className="p-2 text-left">Code</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t bg-orange-50">
                    <td className="p-2 font-bold">▶</td>
                    <td className="p-2 font-medium">{depot?.name} (start)</td>
                    <td className="p-2">—</td>
                  </tr>
                  {result.stops.map(s => (
                    <tr key={s.id} className="border-t">
                      <td className="p-2 text-gray-400">{s.sequence}</td>
                      <td className="p-2">{s.job_address}</td>
                      <td className="p-2 text-gray-400">{s.job_code || '—'}</td>
                    </tr>
                  ))}
                  <tr className="border-t bg-orange-50">
                    <td className="p-2 font-bold">■</td>
                    <td className="p-2 font-medium">{depot?.name} (return)</td>
                    <td className="p-2">—</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* PRAWA strona — mapa */}
        <div className="rounded-lg overflow-hidden border h-96 lg:h-auto">
          <MapContainer center={mapCenter} zoom={7} style={{ height: '100%', minHeight: '500px' }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap contributors'
            />
            {depot && (
              <Marker position={[depot.latitude, depot.longitude]}>
                <Popup><strong>Depot:</strong> {depot.name}</Popup>
              </Marker>
            )}
            {result?.stops.map(s => (
              <Marker key={s.id} position={[s.job_latitude, s.job_longitude]}>
                <Popup>
                  <strong>#{s.sequence}</strong> {s.job_address}
                </Popup>
              </Marker>
            ))}
            {routePoints.length > 0 && (
              <Polyline positions={routePoints} color="green" weight={3} />
            )}
          </MapContainer>
        </div>
      </div>
    </div>
  )
}
