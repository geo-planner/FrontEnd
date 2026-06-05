import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import '../utils/leafletIcons'
import api from '../api/axios'
import AuthBanner from '../components/AuthBanner'

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

function emptyRow() {
  return { address: '', name: '', job_code: '', service_time: '', demand: '', latitude: null, longitude: null, found: null, selected: true }
}

export default function Geocoding() {
  const [mode, setMode] = useState('jobs')
  const [rows, setRows] = useState([emptyRow()])
  const [loading, setLoading] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [geocoded, setGeocoded] = useState(false)

  function switchMode(newMode) {
    if (newMode === mode) return
    setMode(newMode)
    setRows([emptyRow()])
    setSaveMsg('')
    setGeocoded(false)
  }

  function addRow() {
    setRows(prev => [...prev, emptyRow()])
  }

  function removeRow(i) {
    setRows(prev => prev.length === 1 ? [emptyRow()] : prev.filter((_, idx) => idx !== i))
  }

  function updateRow(i, field, value) {
    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: value } : r))
  }

  function toggleRow(i) {
    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, selected: !r.selected } : r))
  }

  async function handleGeocode() {
    const filledRows = rows.filter(r => r.address.trim())
    if (!filledRows.length) return
    setLoading(true)
    setSaveMsg('')
    try {
      const res = await api.post('/geocode/', { addresses: filledRows.map(r => r.address.trim()) })
      let resultIdx = 0
      const newRows = rows.map(r => {
        if (!r.address.trim()) return r
        const geo = res.data[resultIdx++]
        return { ...r, latitude: geo.latitude, longitude: geo.longitude, found: geo.found, selected: geo.found }
      })
      setRows(newRows)
      setGeocoded(true)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    const toSave = rows.filter(r => r.found && r.selected)
    if (!toSave.length) return
    setSaveMsg('')
    try {
      if (mode === 'jobs') {
        await Promise.all(toSave.map(r => api.post('/jobs/', {
          address: r.address,
          latitude: r.latitude,
          longitude: r.longitude,
          ...(r.job_code      ? { job_code: r.job_code } : {}),
          ...(r.service_time  ? { service_time_minutes: parseInt(r.service_time) } : {}),
          ...(r.demand        ? { demand: parseInt(r.demand) } : {}),
        })))
      } else {
        await Promise.all(toSave.map(r => api.post('/depots/', {
          name: r.name || r.address,
          address: r.address,
          latitude: r.latitude,
          longitude: r.longitude,
        })))
      }
      setSaveMsg(`Saved ${toSave.length} ${mode === 'jobs' ? 'job(s)' : 'depot(s)'}`)
    } catch {
      setSaveMsg('Error saving — check console.')
    }
  }

  const foundRows = rows.filter(r => r.found)
  const mapPoints = foundRows.map(r => [r.latitude, r.longitude])

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <AuthBanner />
      <h1 className="text-2xl font-bold mb-1">Geocoding</h1>
      <p className="text-gray-500 text-sm mb-4">
        Add addresses, geocode them, then save as Jobs or Depots with full details.
      </p>

      <div className="grid lg:grid-cols-2 gap-6">

        {/* LEWA */}
        <div className="space-y-3">

          {/* Mode toggle */}
          <div className="flex rounded-lg border overflow-hidden w-fit">
            <button
              onClick={() => switchMode('jobs')}
              className={`px-5 py-2 text-sm font-semibold transition-colors ${mode === 'jobs' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              Jobs
            </button>
            <button
              onClick={() => switchMode('depots')}
              className={`px-5 py-2 text-sm font-semibold transition-colors ${mode === 'depots' ? 'bg-orange-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              Depots
            </button>
          </div>

          {/* Field labels */}
          <div className={`flex gap-2 text-xs text-gray-400 font-medium px-1 ${geocoded ? 'pl-6' : ''}`}>
            <span className="flex-1">Address</span>
            {mode === 'depots' && <span className="w-36">Depot name</span>}
            {mode === 'jobs' && <>
              <span className="w-24">Job code</span>
              <span className="w-36">Service time (min)</span>
              <span className="w-20">Demand</span>
            </>}
          </div>

          {/* Rows */}
          <div className="space-y-2">
            {rows.map((row, i) => (
              <div
                key={i}
                className={`bg-white border rounded-lg p-2.5 space-y-1.5 ${
                  row.found === false ? 'border-red-300 bg-red-50' :
                  row.found === true  ? 'border-green-300' : 'border-gray-200'
                }`}
              >
                <div className="flex gap-2 items-center">
                  {geocoded && row.address.trim() && (
                    <input
                      type="checkbox"
                      checked={row.selected}
                      onChange={() => toggleRow(i)}
                      disabled={!row.found}
                      className="shrink-0"
                    />
                  )}
                  <input
                    type="text"
                    placeholder="Address"
                    value={row.address}
                    onChange={e => updateRow(i, 'address', e.target.value)}
                    className="flex-1 border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  {mode === 'depots' && (
                    <input
                      type="text"
                      placeholder="Name"
                      value={row.name}
                      onChange={e => updateRow(i, 'name', e.target.value)}
                      className="w-36 border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                  )}
                  {mode === 'jobs' && (
                    <>
                      <input
                        type="text"
                        placeholder="Code"
                        value={row.job_code}
                        onChange={e => updateRow(i, 'job_code', e.target.value)}
                        className="w-24 border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                      <input
                        type="number"
                        placeholder="Min"
                        value={row.service_time}
                        onChange={e => updateRow(i, 'service_time', e.target.value)}
                        className="w-16 border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                      <input
                        type="number"
                        placeholder="Demand"
                        value={row.demand}
                        onChange={e => updateRow(i, 'demand', e.target.value)}
                        className="w-20 border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </>
                  )}
                  <button
                    onClick={() => removeRow(i)}
                    className="text-gray-300 hover:text-red-500 text-xl leading-none px-1 shrink-0"
                  >
                    ×
                  </button>
                </div>

                {row.found !== null && row.address.trim() && (
                  <div className="text-xs pl-1">
                    {row.found
                      ? <span className="text-green-600">{row.latitude?.toFixed(5)}, {row.longitude?.toFixed(5)}</span>
                      : <span className="text-red-500">Not found — check address</span>
                    }
                  </div>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={addRow}
            className="w-full text-sm text-gray-400 hover:text-gray-600 border border-dashed border-gray-300 hover:border-gray-400 rounded-lg py-2 transition-colors"
          >
            + Add row
          </button>

          <div className="flex gap-3 flex-wrap items-center">
            <button
              onClick={handleGeocode}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-5 py-2 rounded-lg font-semibold transition-colors text-sm"
            >
              {loading ? 'Geocoding...' : 'Geocode'}
            </button>
            {geocoded && (
              <button
                onClick={handleSave}
                className={`${mode === 'jobs' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-orange-500 hover:bg-orange-600'} text-white px-5 py-2 rounded-lg font-semibold transition-colors text-sm`}
              >
                Save as {mode === 'jobs' ? 'Jobs' : 'Depots'}
              </button>
            )}
            {saveMsg && (
              <p className={`text-sm font-medium ${saveMsg.startsWith('Error') ? 'text-red-600' : 'text-green-700'}`}>
                {saveMsg}
              </p>
            )}
          </div>

        </div>

        {/* PRAWA — mapa */}
        <div className="rounded-lg overflow-hidden border" style={{ height: '480px' }}>
          <MapContainer
            center={[54.5, -3.5]}
            zoom={6}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            {foundRows.map((r, i) => (
              <Marker key={i} position={[r.latitude, r.longitude]}>
                <Popup>
                  {mode === 'depots' && r.name && <><strong>{r.name}</strong><br /></>}
                  {r.address}
                  {r.job_code && <><br /><span className="text-gray-500">[{r.job_code}]</span></>}
                </Popup>
              </Marker>
            ))}
            {mapPoints.length > 0 && <FitBounds points={mapPoints} />}
          </MapContainer>
        </div>

      </div>
    </div>
  )
}
