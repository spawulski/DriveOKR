// frontend/src/components/auth/LoginPage.jsx
import React from 'react'

const LoginPage = () => {
  const handleGitHubLogin = () => {
    window.location.href = 'http://localhost:4000/api/auth/github'
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to DriveOKR
          </h2>
        </div>
        <div>
          <button
            onClick={handleGitHubLogin}
            className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gray-800 hover:bg-gray-900"
          >
            Sign in with GitHub
          </button>
        </div>
      </div>
    </div>
  )
}

export default LoginPage