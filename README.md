# GeoPlanner — Frontend

React frontend for GeoPlanner, a route planning and optimization application.

## What it does

- **Landing page** — overview of the app features (Geocoding, TSP, VRP)
- **Auth** — register and login via JWT tokens (stored in localStorage)
- **Geocoding** — paste addresses, geocode via Django → Nominatim, save as Jobs or Depots
- **TSP** — select depot and jobs, solve Travelling Salesman Problem, view route on map
- **VRP** — Vehicle Routing Problem (coming soon)

Connects to Django REST API backend (`geo-planner/BackEnd`).

## Tech stack

- React 18 + Vite 5
- React Router v6
- Axios (with JWT interceptor)
- React Leaflet v4 + Leaflet 1.9 (maps)
- Tailwind CSS v3

## Setup

```bash
git clone https://github.com/geo-planner/FrontEnd.git
cd FrontEnd
npm install
npm run dev
```

App runs at `http://localhost:5173`. Django backend must be running at `http://localhost:8000`.

## Project structure

```
src/
├── api/
│   └── axios.js          # Axios client with auto JWT header
├── components/
│   └── Navbar.jsx        # Navigation bar
└── pages/
    ├── Home.jsx           # Landing page
    ├── Login.jsx          # Login form
    ├── Register.jsx       # Registration form
    ├── Geocoding.jsx      # Batch geocoding + save as Jobs/Depots
    ├── TSP.jsx            # TSP solver + Leaflet map
    └── VRP.jsx            # VRP solver (coming soon)
```
