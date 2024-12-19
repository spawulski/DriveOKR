// frontend/src/components/auth/AuthCallback.jsx
import React, { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

const AuthCallback = () => {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const token = params.get('token')

    if (token) {
      localStorage.setItem('token', token)
      navigate('/dashboard')
    } else {
      navigate('/login')
    }
  }, [navigate, location])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-xl">Completing authentication...</div>
    </div>
  )
}

export default AuthCallback