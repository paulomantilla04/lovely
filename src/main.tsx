import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './App.css'
import { AuthContextProvider } from './context/AuthContext.tsx'
import { RouterProvider } from 'react-router'
import { router } from './router.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthContextProvider>
      <RouterProvider router={router} />
    </AuthContextProvider>
  </StrictMode>,
)
