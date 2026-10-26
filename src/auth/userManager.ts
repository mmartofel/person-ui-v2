import { UserManager, WebStorageStateStore } from 'oidc-client-ts'
import { requireConfig } from '@/config'
import i18n from '@/i18n'
import { returnToFromLocation } from './returnTo'

let userManager: UserManager | undefined

/**
 * The one OIDC client of the app (Keycloak, Authorization Code + PKCE). Created on first use, so modules that import
 * `@/auth` load without the OIDC settings (the dev-only component gallery has none).
 */
export function getUserManager(): UserManager {
  userManager ??= new UserManager({
    authority: requireConfig('OIDC_AUTHORITY'),
    client_id: requireConfig('OIDC_CLIENT_ID'),
    redirect_uri: `${window.location.origin}/`,
    post_logout_redirect_uri: `${window.location.origin}/`,
    scope: 'openid profile email',
    automaticSilentRenew: true,
    userStore: new WebStorageStateStore({ store: window.sessionStorage }),
  })
  return userManager
}

export interface LoginState {
  returnTo: string
}

let redirecting = false

/**
 * Redirects to Keycloak in the current UI language; after login the app returns to `returnTo`.
 * Rejects when the redirect cannot start (for example Keycloak is unreachable).
 */
export async function login(returnTo = returnToFromLocation(window.location)): Promise<void> {
  if (redirecting) return
  redirecting = true
  const state: LoginState = { returnTo }
  try {
    await getUserManager().signinRedirect({ state, ui_locales: i18n.language })
  } catch (error) {
    redirecting = false
    console.error('Login redirect failed', error)
    throw error
  }
}

export async function getAccessToken(): Promise<string | undefined> {
  const user = await getUserManager().getUser()
  return user && !user.expired ? user.access_token : undefined
}
