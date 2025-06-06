import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Navigation } from './components/molecules/Navigation'
import { HomePage } from './components/pages/HomePage'
import { FavoritesPage } from './components/organisms/FavoritesPage'
import { PantryPage } from './components/pages/PantryPage'
import './App.css'

function App() {
  return (
    <Router>
      <div className="app">
        <Navigation />
        
        <div className="app__background">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/favorites" element={<FavoritesPage />} />
            <Route path="/pantry" element={<PantryPage />} />
          </Routes>
        </div>
      </div>
    </Router>
  )
}

export default App
