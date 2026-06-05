import { useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import api from '../api/axios'

// fix dla brakujacych ikon Leaflet w Vite
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

export default function Geocoding() {
  const [text, setText] = useState('')
  const [results, setResults] = useState([])
  const [selected, setSelected] = useState([])
  const [loading, setLoading] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')

  // wyslij adresy do Django -> Nominatim
  async function handleGeocode() {
    const addresses = text.split('\n').map(a => a.trim()).filter(a => a)
    if (!addresses.length) return
    setLoading(true)
    setSaveMsg('')
    try {
      const res = await api.post('/geocode/', { addresses })
      setResults(res.data)
      setSelected(res.data.filter(r => r.found).map((_, i) => i))
    } finally {
      setLoading(false)
    }
  }

  function toggleSelect(i) {
    setSelected(prev =>
      prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]
    )
  }

  // zapisz zaznaczone jako Joby
  async function saveAsJobs() {
    const toSave = results.filter((_, i) => selected.includes(i) && results[i].found)
    try {
      await Promise.all(toSave.map(r =>
        api.post('/jobs/', { address: r.address, latitude: r.latitude, longitude: r.longitude })
      ))
      setSaveMsg(`Saved ${toSave.length} job(s) successfully.`)
    } catch {
      setSaveMsg('Error saving jobs.')
    }
  }

  // zapisz zaznaczone jako Depot (zazwyczaj jeden)
  async function saveAsDepot() {
    const toSave = results.filter((_, i) => selected.includes(i) && results[i].found)
    try {
      await Promise.all(toSave.map(r =>
        api.post('/depots/', { name: r.address, address: r.address, latitude: r.latitude, longitude: r.longitude })
      ))
      setSaveMsg(`Saved ${toSave.length} depot(s) successfully.`)
    } catch {
      setSaveMsg('Error saving depots.')
    }
  }

  const foundResults = results.filter(r => r.found)
  const mapCenter = foundResults.length
    ? [foundResults[0].latitude, foundResults[0].longitude]
    : [54.5, -3.5]

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-bold mb-1">Geocoding</h1>
      <p className="text-gray-500 text-sm mb-6">
        Paste addresses (one per line), geocode them, then save as Jobs or Depots.
      </p>

      <div className="grid lg:grid-cols-2 gap-6">

        {/* LEWA strona — input i wyniki */}
        <div className="space-y-4">
          <textarea
            className="w-full border rounded-lg p-3 h-36 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Edinburgh Castle, Edinburgh&#10;Glasgow Central Station&#10;Stirling Castle"
            value={text}
            onChange={e => setText(e.target.value)}
          />

          <button
            onClick={handleGeocode}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
          >
            {loading ? 'Geocoding...' : 'Geocode'}
          </button>

          {results.length > 0 && (
            <>
              <div className="overflow-x-auto rounded-lg border bg-white">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-2 text-left w-8"></th>
                      <th className="p-2 text-left">Address</th>
                      <th className="p-2 text-right">Lat</th>
                      <th className="p-2 text-right">Lon</th>
                      <th className="p-2 text-center">Found</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r, i) => (
                      <tr key={i} className={`border-t ${!r.found ? 'bg-red-50' : ''}`}>
                        <td className="p-2">
                          <input
                            type="checkbox"
                            checked={selected.includes(i)}
                            onChange={() => toggleSelect(i)}
                            disabled={!r.found}
                          />
                        </td>
                        <td className="p-2">{r.address}</td>
                        <td className="p-2 text-right text-gray-500">{r.latitude?.toFixed(4) ?? '—'}</td>
                        <td className="p-2 text-right text-gray-500">{r.longitude?.toFixed(4) ?? '—'}</td>
                        <td className="p-2 text-center">
                          {r.found ? '✅' : '❌'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={saveAsJobs}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                >
                  Save selected as Jobs
                </button>
                <button
                  onClick={saveAsDepot}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                >
                  Save selected as Depot
                </button>
              </div>

              {saveMsg && (
                <p className={`text-sm font-medium ${saveMsg.includes('Error') ? 'text-red-500' : 'text-green-600'}`}>
                  {saveMsg}
                </p>
              )}
            </>
          )}
        </div>

        {/* PRAWA strona — mapa */}
        <div className="rounded-lg overflow-hidden border h-96 lg:h-auto">
          <MapContainer center={mapCenter} zoom={6} style={{ height: '100%', minHeight: '400px' }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap contributors'
            />
            {foundResults.map((r, i) => (
              <Marker key={i} position={[r.latitude, r.longitude]}>
                <Popup>{r.address}</Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  )
}
