import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Signup from './pages/Signup'
import Login from './pages/Login'
import Profile from './pages/Profile'
import Movie from './pages/Movie'
import Feed from './pages/Feed'
import Users from './pages/Users'
import Layout from './components/Layout'
import Import from './pages/Import'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/profile/:username" element={<Profile />} />
        <Route path="/movie/:id" element={<Movie />} />
        <Route path="/feed" element={<Feed />} />
        <Route path="/users" element={<Users />} />
        <Route path="/import" element={<Import />} />
      </Routes>
    </Layout>
  )
}

export default App