import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

export default function Account() {
  const [tab, setTab] = useState('jobs')
  const [jobs, setJobs] = useState([])
  const [depots, setDepots] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    if (!localStorage.getItem('access_token')) { navigate('/login'); return }
    fetchAll()
  }, [])

  function fetchAll() {
    api.get('/jobs/?include_archived=1').then(r => setJobs(r.data)).catch(() => {})
    api.get('/depots/?include_archived=1').then(r => setDepots(r.data)).catch(() => {})
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

  const items = tab === 'jobs' ? jobs : depots
  const active = items.filter(i => i.is_active)
  const archived = items.filter(i => !i.is_active)

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-bold mb-1">My Account</h1>
      <p className="text-gray-500 text-sm mb-6">Manage your jobs and depots.</p>

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
      </div>

      {/* Active */}
      <Section
        title="Active"
        items={active}
        tab={tab}
        onToggle={item => toggleActive(tab, item)}
        onDelete={id => remove(tab, id)}
      />

      {/* Archived */}
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
                <p className="font-medium text-sm truncate">{item.name}</p>
              )}
              {tab === 'jobs' && item.job_code && (
                <p className="text-xs text-gray-400 mb-0.5">[{item.job_code}]</p>
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
