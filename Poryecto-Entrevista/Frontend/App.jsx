import { useState } from 'react'
import Dashboard from './pages/evaluador/Dashboard'
import Collaborators from './pages/evaluador/Collaborators'
import Evaluations from './pages/evaluador/Evaluations'
import TraineePortal from './pages/colaborador/TraineePortal'
import MyExam from './pages/colaborador/MyExam'
import Login from './pages/Login'
import { signOut } from 'firebase/auth'
import { auth } from './firebaseClient'
import './styles/evaluador/Dashboard.css'
import './styles/evaluador/Collaborators.css'
import './styles/colaborador/TraineePortal.css'
import './styles/colaborador/MyExam.css'

export default function App() {
  // user = { uid, token, profile: { name, role, position, initials } }
  const [user, setUser] = useState(null)
  const [page, setPage] = useState('inicio')

  function handleLogin(loggedUser) {
    setUser(loggedUser)
    setPage(loggedUser.profile?.role === 'colaborador' ? 'mi-espacio' : 'inicio')
  }

  async function handleLogout() {
    await signOut(auth)
    setUser(null)
    setPage('inicio')
  }

  if (!user) {
    return <Login onLogin={handleLogin} />
  }

  if (page === 'colaboradores') {
    return <Collaborators onLogout={handleLogout} onNavigate={setPage} token={user.token} />
  }
  if (page === 'evaluaciones') {
    return <Evaluations onLogout={handleLogout} onNavigate={setPage} token={user.token} profile={user.profile} />
  }
  if (page === 'mi-espacio') {
    return <TraineePortal onLogout={handleLogout} onNavigate={setPage} token={user.token} profile={user.profile} />
  }
  if (page === 'mi-historial') {
    return (
      <MyExam
        onLogout={handleLogout}
        onNavigate={(label) => setPage(label === 'Historial' ? 'mi-historial' : 'mi-espacio')}
        token={user.token}
        profile={user.profile}
      />
    )
  }
  return <Dashboard onLogout={handleLogout} onNavigate={setPage} token={user.token} profile={user.profile} />
}