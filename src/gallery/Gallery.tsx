// Dev-only component gallery at /__gallery (see src/main.tsx): the real generic components with the persons and
// tasks fixtures, without .env.local, API or Keycloak. Not part of the production bundle.
import './register'
import { useMemo, useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { User } from 'oidc-client-ts'
import { AuthContext, type AuthContextProps } from 'react-oidc-context'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { rolesClaim } from '@/config'
import { AppShell } from '@/components/app/AppShell'
import { ThemeProvider } from '@/components/app/theme/ThemeProvider'
import { Toaster } from '@/components/ui/sonner'
import { GalleryPage } from './GalleryPage'
import { GalleryRoleContext, type GalleryRole } from './role'

const roles: Record<GalleryRole, string[]> = {
  writer: ['person-viewer', 'person-editor'],
  reader: ['person-viewer'],
}

/** An unsigned access token whose roles claim (`rolesClaim()`, a dot path) holds `values`. */
function fakeToken(values: string[]): string {
  const path = rolesClaim().split('.')
  const claims = path.reduceRight<unknown>((inner, key) => ({ [key]: inner }), values)
  const encode = (value: object) => btoa(JSON.stringify(value)).replace(/=+$/, '')
  return `${encode({ alg: 'none' })}.${encode(claims as object)}.`
}

function fakeAuth(role: GalleryRole): AuthContextProps {
  const user = {
    access_token: fakeToken(roles[role]),
    expired: false,
    profile: { sub: role, name: role === 'writer' ? 'Anna Kowalska' : 'Jan Zieliński', email: `${role}@example.com` },
  } as unknown as User
  return {
    user,
    isAuthenticated: true,
    isLoading: false,
    signoutRedirect: async () => {},
  } as unknown as AuthContextProps
}

// One route: every link (nav, rows, breadcrumbs, "Back to list") stays on the gallery page inside the real app
// shell. It starts on the persons list, so the header shows its breadcrumb; a row link shows list › record.
const router = createMemoryRouter([{ element: <AppShell />, children: [{ path: '*', element: <GalleryPage /> }] }], {
  initialEntries: ['/persons'],
})

export function Gallery() {
  const [role, setRole] = useState<GalleryRole>('writer')
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: false } } }))
  const auth = useMemo(() => fakeAuth(role), [role])
  const roleContext = useMemo(() => ({ role, setRole }), [role])

  return (
    <AuthContext.Provider value={auth}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <GalleryRoleContext.Provider value={roleContext}>
            <RouterProvider router={router} />
            <Toaster />
          </GalleryRoleContext.Provider>
        </ThemeProvider>
      </QueryClientProvider>
    </AuthContext.Provider>
  )
}
