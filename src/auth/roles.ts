import { useMemo } from 'react'
import { useAuth } from 'react-oidc-context'
import { rolesClaim } from '@/config'

/** Reads the roles claim (a dot path, `OIDC_ROLES_CLAIM`) from a JWT access token; returns [] for a missing or malformed token. */
export function decodeRoles(accessToken: string | undefined, claim = rolesClaim()): string[] {
  if (!accessToken) return []
  try {
    const payload = accessToken.split('.')[1]
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const claims = JSON.parse(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')))
    const roles: unknown = claim.split('.').reduce<unknown>((node, key) => (node as Record<string, unknown>)?.[key], claims)
    return Array.isArray(roles) ? roles.filter((role): role is string => typeof role === 'string') : []
  } catch {
    return []
  }
}

export function useRoles(): string[] {
  const token = useAuth().user?.access_token
  return useMemo(() => decodeRoles(token), [token])
}
