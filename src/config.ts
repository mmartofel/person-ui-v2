// OIDC settings. In the production image they come from /config.js, which the container entrypoint writes from its
// environment at startup (docker/10-ui-runtime-config.envsh), so one image runs in every environment. The dev server has
// no /config.js: the values come from .env.local (VITE_*, see .env.example).

type ConfigName = 'OIDC_AUTHORITY' | 'OIDC_CLIENT_ID' | 'OIDC_ROLES_CLAIM'

declare global {
  interface Window {
    /** Set by /config.js in the production image. */
    __APP_CONFIG__?: Partial<Record<ConfigName, string>>
  }
}

const devValues: Record<ConfigName, string | undefined> = {
  OIDC_AUTHORITY: import.meta.env.VITE_OIDC_AUTHORITY,
  OIDC_CLIENT_ID: import.meta.env.VITE_OIDC_CLIENT_ID,
  OIDC_ROLES_CLAIM: import.meta.env.VITE_OIDC_ROLES_CLAIM,
}

function configValue(name: ConfigName): string | undefined {
  const runtime = window.__APP_CONFIG__
  return (runtime ? runtime[name] : devValues[name]) || undefined
}

/** A required setting; the error names the variable to set where the app runs. */
export function requireConfig(name: Exclude<ConfigName, 'OIDC_ROLES_CLAIM'>): string {
  const value = configValue(name)
  if (value) return value
  throw new Error(
    window.__APP_CONFIG__
      ? `${name} is not set in the container environment (see README "Deploy").`
      : `VITE_${name} is not set: copy .env.example to .env.local (see README).`,
  )
}

/** The access token claim with the user's roles, as a dot path; Keycloak realm roles by default. */
export const rolesClaim = (): string => configValue('OIDC_ROLES_CLAIM') ?? 'realm_access.roles'
