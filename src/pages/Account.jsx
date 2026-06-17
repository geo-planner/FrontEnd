import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

export default function Account() {
  const [tab, setTab] = useState('jobs')
  const [jobs, setJobs] = useState([])
  const [depots, setDepots] = useState([])
  const [routes, setRoutes] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [vehicleTypes, setVehicleTypes] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    if (!localStorage.getItem('access_token')) { navigate('/login'); return }
    fetchAll()
  }, [])

  function fetchAll() {
    api.get('/jobs/?include_archived=1').then(r => setJobs(r.data)).catch(() => {})
    api.get('/depots/?include_archived=1').then(r => setDepots(r.data)).catch(() => {})
    api.get('/routes/').then(r => setRoutes(r.data)).catch(() => {})
    api.get('/vehicles/').then(r => setVehicles(r.data)).catch(() => {})
    api.get('/vehicle-types/').then(r => setVehicleTypes(r.data)).catch(() => {})
  }

  async function toggleActive(type, item) {
    const url = type === 'jobs' ? `/jobs/${item.id}/` : `/depots/${item.id}/`
    await api.patch(url, { is_active: !item.is_active })
    fetchAll()
  }

  async function remove(type, id) {
    if (!window.confirm('Delete permanently? This cannot be undone.')) return
    const url = type === 'jobs' ? `/jobs/${id}/` : `/depots/${id}/`
    await api.delete(url)
    fetchAll()
  }

  async function removeRoute(id) {
    if (!window.confirm('Delete this route permanently?')) return
    await api.delete(`/routes/${id}/`)
    fetchAll()
  }

  async function removeVehicle(id) {
    if (!window.confirm('Delete this vehicle permanently?')) return
    await api.delete(`/vehicles/${id}/`)
    fetchAll()
  }

  const items = tab === 'jobs' ? jobs : depots
  const active = items.filter(i => i.is_active)
  const archived = items.filter(i => !i.is_active)

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-bold mb-1">My Account</h1>
      <p className="text-gray-500 text-sm mb-6">Manage your jobs, depots and routes.</p>

      {/* Tab switch */}
      <div className="flex rounded-lg border overflow-hidden w-fit mb-6">
        <button
          onClick={() => setTab('jobs')}
          className={`px-6 py-2 text-sm font-semibold transition-colors ${tab === 'jobs' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
        >
          Jobs ({jobs.length})
        </button>
        <button
          onClick={() => setTab('depots')}
          className={`px-6 py-2 text-sm font-semibold transition-colors ${tab === 'depots' ? 'bg-orange-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
        >
          Depots ({depots.length})
        </button>
        <button
          onClick={() => setTab('routes')}
          className={`px-6 py-2 text-sm font-semibold transition-colors ${tab === 'routes' ? 'bg-green-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
        >
          Routes ({routes.length})
        </button>
        <button
          onClick={() => setTab('vehicles')}
          className={`px-6 py-2 text-sm font-semibold transition-colors ${tab === 'vehicles' ? 'bg-purple-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
        >
          Vehicles ({vehicles.length})
        </button>
      </div>

      {(tab === 'jobs' || tab === 'depots') && (
        <>
          <Section
            title="Active"
            items={active}
            tab={tab}
            onToggle={item => toggleActive(tab, item)}
            onDelete={id => remove(tab, id)}
          />
          {archived.length > 0 && (
            <Section
              title="Archived"
              items={archived}
              tab={tab}
              onToggle={item => toggleActive(tab, item)}
              onDelete={id => remove(tab, id)}
              muted
            />
          )}
          {items.length === 0 && (
            <p className="text-gray-400 text-sm">No {tab} found.</p>
          )}
        </>
      )}

      {tab === 'routes' && (
        <RoutesSection routes={routes} onDelete={removeRoute} />
      )}

      {tab === 'vehicles' && (
        <VehiclesSection vehicles={vehicles} vehicleTypes={vehicleTypes} onDelete={removeVehicle} onAdd={fetchAll} />
      )}
    </div>
  )
}

const BACKEND_URL = 'http://127.0.0.1:8000'
const EMPTY_VEHICLE = { name: '', vehicle_type: '', capacity: '', starting_time: '', working_time_minutes: '', photo: null }

// DRF może zwrócić URL relatywny lub absolutny — ta funkcja zawsze daje pełny URL
function photoUrl(path) {
  if (!path) return null
  if (path.startsWith('http')) return path
  return BACKEND_URL + path
}

function VehiclesSection({ vehicles, vehicleTypes, onDelete, onAdd }) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_VEHICLE)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleAdd(e) {
    e.preventDefault()
    if (!form.name || !form.vehicle_type) return setError('Name and type are required.')
    setSaving(true)
    setError('')
    try {
      // Pliki wymagają FormData zamiast zwykłego JSON
      const data = new FormData()
      data.append('name', form.name)
      data.append('vehicle_type', parseInt(form.vehicle_type))
      if (form.capacity)             data.append('capacity', parseInt(form.capacity))
      if (form.starting_time)        data.append('starting_time', form.starting_time)
      if (form.working_time_minutes) data.append('working_time_minutes', parseInt(form.working_time_minutes))
      if (form.photo)                data.append('photo', form.photo)

      await api.post('/vehicles/', data, { headers: { 'Content-Type': 'multipart/form-data' } })
      setForm(EMPTY_VEHICLE)
      setShowForm(false)
      onAdd()
    } catch {
      setError('Error saving vehicle.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-3">
      {vehicles.length === 0 && !showForm && (
        <p className="text-gray-400 text-sm">No vehicles found.</p>
      )}

      {vehicles.length > 0 && (
        <div className="bg-white border rounded-lg overflow-hidden divide-y">
          {vehicles.map(v => (
            <div key={v.id} className="flex items-center justify-between px-4 py-3 gap-4">
              <div className="flex items-center gap-3 min-w-0">
                {photoUrl(v.photo)
                  ? <img src={photoUrl(v.photo)} alt={v.name} className="w-10 h-10 rounded object-cover shrink-0 border" />
                  : <div className="w-10 h-10 rounded bg-gray-100 border flex items-center justify-center text-gray-300 shrink-0 text-lg">🚗</div>
                }
                <div className="min-w-0">
                  <p className="font-medium text-sm">{v.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {v.vehicle_type_name}
                    {v.capacity             ? ` · capacity ${v.capacity}` : ''}
                    {v.working_time_minutes ? ` · ${v.working_time_minutes} min` : ''}
                    {v.starting_time        ? ` · starts ${v.starting_time}` : ''}
                  </p>
                </div>
              </div>
              <button
                onClick={() => onDelete(v.id)}
                className="text-xs px-3 py-1 rounded border border-red-300 text-red-500 hover:bg-red-50 font-medium transition-colors shrink-0"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleAdd} className="bg-white border rounded-lg p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">New vehicle</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Name *</label>
              <input
                type="text"
                placeholder="e.g. Van #1"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Type *</label>
              <select
                value={form.vehicle_type}
                onChange={e => setForm(f => ({ ...f, vehicle_type: e.target.value }))}
                className="w-full border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
              >
                <option value="">— select —</option>
                {vehicleTypes.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Capacity</label>
              <input
                type="number"
                placeholder="e.g. 100"
                value={form.capacity}
                onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))}
                className="w-full border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Working time (min)</label>
              <input
                type="number"
                placeholder="e.g. 480"
                value={form.working_time_minutes}
                onChange={e => setForm(f => ({ ...f, working_time_minutes: e.target.value }))}
                className="w-full border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Starting time</label>
              <input
                type="time"
                value={form.starting_time}
                onChange={e => setForm(f => ({ ...f, starting_time: e.target.value }))}
                className="w-full border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Photo (optional)</label>
              <input
                type="file"
                accept="image/*"
                onChange={e => setForm(f => ({ ...f, photo: e.target.files[0] || null }))}
                className="w-full text-sm text-gray-500 file:mr-3 file:py-1 file:px-3 file:rounded file:border file:border-gray-300 file:text-xs file:bg-white hover:file:bg-gray-50"
              />
            </div>
          </div>
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-4 py-1.5 rounded text-sm font-semibold transition-colors"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setForm(EMPTY_VEHICLE); setError('') }}
              className="border px-4 py-1.5 rounded text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full text-sm text-gray-400 hover:text-gray-600 border border-dashed border-gray-300 hover:border-gray-400 rounded-lg py-2 transition-colors"
        >
          + Add vehicle
        </button>
      )}
    </div>
  )
}

function RoutesSection({ routes, onDelete }) {
  if (routes.length === 0) return <p className="text-gray-400 text-sm">No routes found.</p>
  return (
    <div className="space-y-2">
      {routes.map(route => (
        <RouteAccordion key={route.id} route={route} onDelete={onDelete} />
      ))}
    </div>
  )
}

function RouteAccordion({ route, onDelete }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="bg-white border rounded-lg overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 select-none"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-gray-400 text-xs">{open ? '▲' : '▼'}</span>
          <div className="min-w-0">
            <p className="font-medium text-sm truncate">{route.name}</p>
            <p className="text-xs text-gray-400">
              {route.route_type_name} · {route.stops?.length ?? 0} stops
              {route.total_distance_km ? ` · ${route.total_distance_km} km` : ''}
              {' · '}{new Date(route.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-4" onClick={e => e.stopPropagation()}>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            route.route_status_name === 'Active' ? 'bg-green-100 text-green-700' :
            route.route_status_name === 'Archived' ? 'bg-gray-100 text-gray-500' :
            'bg-yellow-100 text-yellow-700'
          }`}>
            {route.route_status_name}
          </span>
          <button
            onClick={() => onDelete(route.id)}
            className="text-xs px-3 py-1 rounded border border-red-300 text-red-500 hover:bg-red-50 font-medium transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Accordion body */}
      {open && (
        <div className="border-t text-sm">
          {/* Depot — start */}
          <div className="flex items-center gap-3 px-4 py-2 bg-orange-50">
            <span className="w-6 text-center font-bold text-orange-500 text-xs">▶</span>
            <span className="font-medium">{route.depot_name}</span>
            <span className="text-xs text-gray-400">{route.depot_address}</span>
            <span className="text-xs text-gray-400 ml-auto">start</span>
          </div>

          {/* Stops */}
          {route.stops?.map(stop => (
            <div key={stop.id} className="flex items-center gap-3 px-4 py-2 border-t hover:bg-gray-50">
              <span className="w-6 text-center text-xs text-gray-400 font-mono">{stop.sequence}</span>
              <span className="flex-1 truncate">{stop.job_address}</span>
              {stop.job_code && (
                <span className="text-xs text-gray-400 shrink-0">[{stop.job_code}]</span>
              )}
            </div>
          ))}

          {/* Depot — return */}
          <div className="flex items-center gap-3 px-4 py-2 bg-orange-50 border-t">
            <span className="w-6 text-center font-bold text-orange-500 text-xs">■</span>
            <span className="font-medium">{route.depot_name}</span>
            <span className="text-xs text-gray-400">{route.depot_address}</span>
            <span className="text-xs text-gray-400 ml-auto">return</span>
          </div>
        </div>
      )}
    </div>
  )
}

function Section({ title, items, tab, onToggle, onDelete, muted }) {
  return (
    <div className="mb-6">
      <h2 className={`text-xs font-semibold uppercase tracking-wide mb-2 ${muted ? 'text-gray-400' : 'text-gray-600'}`}>
        {title} ({items.length})
      </h2>
      <div className="bg-white border rounded-lg overflow-hidden divide-y">
        {items.map(item => (
          <div key={item.id} className={`flex items-center justify-between px-4 py-3 gap-4 ${muted ? 'opacity-60' : ''}`}>
            <div className="min-w-0">
              {tab === 'depots' && (
                <p className="font-medium text-sm truncate">
                  {item.name}
                  {item.latitude && item.longitude && (
                    <span className="text-xs text-gray-400 font-normal ml-2">
                      [{item.latitude.toFixed(4)}; {item.longitude.toFixed(4)}]
                    </span>
                  )}
                </p>
              )}
              {tab === 'jobs' && (
                <p className="text-xs text-gray-400 mb-0.5">
                  {item.job_code && <span>{item.job_code}</span>}
                  {item.latitude && item.longitude && (
                    <span className="ml-2">[{item.latitude.toFixed(4)}; {item.longitude.toFixed(4)}]</span>
                  )}
                </p>
              )}
              <p className={`text-sm truncate ${tab === 'depots' ? 'text-gray-500 text-xs' : 'font-medium'}`}>
                {item.address}
              </p>
              {tab === 'jobs' && (item.service_time_minutes || item.demand) && (
                <p className="text-xs text-gray-400 mt-0.5">
                  {item.service_time_minutes ? `${item.service_time_minutes} min` : ''}
                  {item.service_time_minutes && item.demand ? ' · ' : ''}
                  {item.demand ? `demand ${item.demand}` : ''}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => onToggle(item)}
                className={`text-xs px-3 py-1 rounded border font-medium transition-colors ${
                  item.is_active
                    ? 'border-gray-300 text-gray-500 hover:border-orange-400 hover:text-orange-600'
                    : 'border-green-400 text-green-600 hover:bg-green-50'
                }`}
              >
                {item.is_active ? 'Archive' : 'Restore'}
              </button>
              <button
                onClick={() => onDelete(item.id)}
                className="text-xs px-3 py-1 rounded border border-red-300 text-red-500 hover:bg-red-50 font-medium transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
