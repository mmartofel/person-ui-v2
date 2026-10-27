/// <reference types="vite/client" />

/** The blueprint release the app was built from (vite.config.ts: `.blueprint-version`, or CHANGELOG.md in the blueprint). */
declare const __BLUEPRINT_VERSION__: string
/** `info.version` of contract/openapi.json at build time; null while there is no contract. */
declare const __CONTRACT_VERSION__: string | null

interface ImportMetaEnv {
  readonly VITE_OIDC_AUTHORITY: string
  readonly VITE_OIDC_CLIENT_ID: string
  /** Dot path of the roles claim in the access token; default `realm_access.roles` (Keycloak realm roles). */
  readonly VITE_OIDC_ROLES_CLAIM?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
