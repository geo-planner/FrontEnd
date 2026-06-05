import { Link } from 'react-router-dom'

export default function AuthBanner() {
  if (localStorage.getItem('access_token')) return null
  return (
    <div className="mb-4 bg-yellow-50 border border-yellow-300 text-yellow-800 rounded-lg px-4 py-3 text-sm">
      You are not logged in — this page requires an account.{' '}
      <Link to="/login" className="font-semibold underline hover:text-yellow-900">Log in</Link>
      {' '}or{' '}
      <Link to="/register" className="font-semibold underline hover:text-yellow-900">register</Link>
      {' '}to use this feature.
    </div>
  )
}
