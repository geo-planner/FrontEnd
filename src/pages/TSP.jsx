import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import '../utils/leafletIcons'
import api from '../api/axios'
import AuthBanner from '../components/AuthBanner'

// komponent pomocniczy — przesuwa widok mapy gdy pojawia sie wynik
function FitBounds({ points }) {
  const map = useMap()
  useEffect(() => {
    if (points.length === 1) {
      map.setView(points[0], 13)
    } else if (points.length > 1) {
      map.fitBounds(points, { padding: [40, 40] })
    }
  }, [points, map])
  return null
}

export default function TSP() {
  const [depots, setDepots] = useState([])
  const [jobs, setJobs] = useState([])
  const [selectedDepot, setSelectedDepot] = useState('')
  const [selectedJobs, setSelectedJobs] = useState([])
  const [routeName, setRouteName] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!localStorage.getItem('access_token')) return
    api.get('/depots/').then(r => setDepots(r.data)).catch(() => {})
    api.get('/jobs/').then(r => setJobs(r.data)).catch(() => {})
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
      const routeRes = await api.post('/routes/', {
        name: routeName || 'TSP Route',
        depot: parseInt(selectedDepot),
        route_type: 1,
        route_status: 1,
      })
      const solveRes = await api.post(`/routes/${routeRes.data.id}/solve/`, {
        job_ids: selectedJobs,
      })
      setResult(solveRes.data)
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  const depot = depots.find(d => d.id === parseInt(selectedDepot))

  const routePoints = result && depot
    ? [
        [depot.latitude, depot.longitude],
        ...result.stops.map(s => [s.job_latitude, s.job_longitude]),
        [depot.latitude, depot.longitude],
      ]
    : []

  // Jobs zaznaczone na liscie (z koordynatami) — widoczne na mapie przed solve
  const selectedJobObjects = jobs.filter(j => selectedJobs.includes(j.id) && j.latitude)

  // Punkty do FitBounds: trasa po solve, lub zaznaczone joby+depot przed solve
  const previewPoints = [
    ...(depot ? [[depot.latitude, depot.longitude]] : []),
    ...selectedJobObjects.map(j => [j.latitude, j.longitude]),
  ]
  const fitPoints = routePoints.length > 1 ? routePoints : previewPoints

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <AuthBanner />
      <h1 className="text-2xl font-bold mb-1">TSP — Travelling Salesman Problem</h1>
      <p className="text-gray-500 text-sm mb-6">
        Select a depot and jobs, then solve to find the shortest route visiting all points.
      </p>

      <div className="grid lg:grid-cols-2 gap-6">

        {/* LEWA — konfiguracja */}

        <div className="space-y-4">

          {/* Depot */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Depot (starting point)</label>
            {depots.length === 0
              ? <p className="text-sm text-orange-500">No depots found. Add one via Geocoding first.</p>
              : (
                <select
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={selectedDepot}
                  onChange={e => { setSelectedDepot(e.target.value); setResult(null) }}
                >
                  <option value="">— select depot —</option>
                  {depots.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              )
            }
          </div>

          {/* Jobs */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Jobs to visit <span className="text-gray-400 font-normal">({selectedJobs.length} selected)</span>
            </label>
            <div className="border rounded-lg bg-white max-h-56 overflow-y-auto divide-y text-sm">
              {jobs.length === 0
                ? <p className="p-3 text-gray-400">No jobs found. Add jobs via Geocoding first.</p>
                : jobs.map(j => (
                  <label key={j.id} className={`flex items-center gap-3 p-2 cursor-pointer hover:bg-gray-50 ${!j.latitude ? 'opacity-40' : ''}`}>
                    <input
                      type="checkbox"
                      checked={selectedJobs.includes(j.id)}
                      onChange={() => toggleJob(j.id)}
                      disabled={!j.latitude}
                    />
                    <span className="truncate">
                      {j.job_code ? <span className="text-gray-400 mr-1">[{j.job_code}]</span> : null}
                      {j.address}
                      {!j.latitude && <span className="text-red-400 ml-1">— no coordinates</span>}
                    </span>
                  </label>
                ))
              }
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

          {error && <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded p-2">{error}</p>}

          <button
            onClick={handleSolve}
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-2.5 rounded-lg font-semibold transition-colors"
          >
            {loading ? '⏳ Solving...' : '▶ Solve TSP'}
          </button>

          {/* Wyniki */}
          {result && (
            <div className="bg-white border rounded-lg overflow-hidden">
              <div className="bg-green-50 border-b px-4 py-2 flex justify-between items-center">
                <span className="font-semibold text-sm text-green-800">Route: {result.name}</span>
                {result.total_distance_km && (
                  <span className="text-sm text-gray-500">{result.total_distance_km.toFixed(1)} km</span>
                )}
              </div>
              <table className="w-full text-sm">
                <tbody>
                  <tr className="bg-orange-50 border-b">
                    <td className="p-2 w-8 text-center font-bold text-orange-600">▶</td>
                    <td className="p-2 font-medium">{depot?.name} <span className="text-gray-400 text-xs">(start)</span></td>
                    <td className="p-2 text-gray-400 text-xs">—</td>
                  </tr>
                  {result.stops.map(s => (
                    <tr key={s.id} className="border-b hover:bg-gray-50">
                      <td className="p-2 text-center text-gray-400 text-xs">{s.sequence}</td>
                      <td className="p-2">{s.job_address}</td>
                      <td className="p-2 text-gray-400 text-xs">{s.job_code || ''}</td>
                    </tr>
                  ))}
                  <tr className="bg-orange-50">
                    <td className="p-2 w-8 text-center font-bold text-orange-600">■</td>
                    <td className="p-2 font-medium">{depot?.name} <span className="text-gray-400 text-xs">(return)</span></td>
                    <td className="p-2 text-gray-400 text-xs">—</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* PRAWA — mapa */}
        <div className="rounded-lg overflow-hidden border" style={{ height: '560px' }}>
          <MapContainer
            center={[54.5, -3.5]}
            zoom={7}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />

            {/* depot marker */}
            {depot && (
              <Marker position={[depot.latitude, depot.longitude]}>
                <Popup><strong>Depot:</strong> {depot.name}</Popup>
              </Marker>
            )}

            {/* markery zaznaczonych jobow przed solve */}
            {!result && selectedJobObjects.map(j => (
              <Marker key={j.id} position={[j.latitude, j.longitude]}>
                <Popup>
                  {j.job_code && <><span className="text-gray-500">[{j.job_code}]</span><br /></>}
                  {j.address}
                </Popup>
              </Marker>
            ))}

            {/* markery przystankow z numerami (po solve) */}
            {result?.stops.map(s => (
              <Marker key={s.id} position={[s.job_latitude, s.job_longitude]}>
                <Popup>
                  <strong>Stop #{s.sequence}</strong><br />{s.job_address}
                  {s.job_code && <><br /><span className="text-gray-500">{s.job_code}</span></>}
                </Popup>
              </Marker>
            ))}

            {/* linia trasy */}
            {routePoints.length > 1 && (
              <Polyline positions={routePoints} color="#16a34a" weight={3} opacity={0.8} />
            )}

            {/* automatyczne dopasowanie widoku — do zaznaczonych lub do trasy */}
            {fitPoints.length > 0 && <FitBounds points={fitPoints} />}
          </MapContainer>
        </div>

      </div>
    </div>
  )
}
