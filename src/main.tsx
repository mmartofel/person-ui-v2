import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router'
import '@/i18n'
import { setAccessTokenGetter, setUnauthorizedHandler } from '@/api/fetcher'
import { queryClient } from '@/api/queryClient'
import { AuthProvider } from '@/auth'
import { getAccessToken, login } from '@/auth/userManager'
import { ThemeProvider } from '@/components/app/theme/ThemeProvider'
import { Toaster } from '@/components/ui/sonner'
import { router } from '@/router'
import '@/index.css'

setAccessTokenGetter(getAccessToken)
setUnauthorizedHandler(() => void login().catch(() => {}))

const navigateAfterLogin = (to: string) => void router.navigate(to, { replace: true })
const root = createRoot(document.getElementById('root')!)

// The component gallery (docs/DESIGN.md): dev server only, outside AuthProvider, so it needs no .env.local.
// In a production build DEV is false and the branch with its chunk is dropped.
if (import.meta.env.DEV && window.location.pathname.startsWith('/__gallery')) {
  void import('@/gallery/Gallery').then(({ Gallery }) =>
    root.render(
      <StrictMode>
        <Gallery />
      </StrictMode>,
    ),
  )
} else {
  root.render(
    <StrictMode>
      <AuthProvider navigate={navigateAfterLogin}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <RouterProvider router={router} />
            <Toaster />
          </ThemeProvider>
        </QueryClientProvider>
      </AuthProvider>
    </StrictMode>,
  )
}
