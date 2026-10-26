/// <reference types="vitest/config" />
import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'node:fs'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import { parse } from 'yaml'

// Imports *.yaml files (ui-manifest.yaml) as JSON modules, parsed at build time.
function yamlPlugin(): Plugin {
  return {
    name: 'yaml',
    transform(code, id) {
      if (!id.endsWith('.yaml')) return null
      return { code: `export default ${JSON.stringify(parse(code))}`, map: null }
    },
  }
}

const readApp = () =>
  (parse(readFileSync('ui-manifest.yaml', 'utf8')) as { app: { name: string; languages: string[] } }).app

// The pre-paint script (scripts/prepaint.js) with the languages of ui-manifest.yaml `app.languages`.
const prepaintScript = () =>
  `${readFileSync('scripts/prepaint.js', 'utf8')}prepaint(${JSON.stringify(readApp().languages)})\n`

// Fills index.html from ui-manifest.yaml `app`: the <title>, and /prepaint.js (theme and language before the first
// paint; served in dev, emitted in the build). The build also loads /config.js, the runtime configuration that the
// production image writes at startup (src/config.ts). Both are files, not inline scripts, for the CSP.
function manifestHtmlPlugin(): Plugin {
  return {
    name: 'manifest-html',
    configureServer(server) {
      server.middlewares.use('/prepaint.js', (_req, res) => {
        res.setHeader('Content-Type', 'text/javascript')
        res.end(prepaintScript())
      })
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'prepaint.js', source: prepaintScript() })
      // A placeholder for hosts without the image's entrypoint (`npm run preview`): the app then uses the VITE_* values.
      this.emitFile({ type: 'asset', fileName: 'config.js', source: '// Replaced at container start (docker/10-ui-runtime-config.envsh).\n' })
    },
    transformIndexHtml(html, ctx) {
      const escaped = readApp().name.replace(/&/g, '&amp;').replace(/</g, '&lt;')
      const script = (src: string) => ({ tag: 'script', attrs: { src }, injectTo: 'head' as const })
      return {
        html: html.replace('%APP_NAME%', escaped),
        tags: ctx.server ? [script('/prepaint.js')] : [script('/prepaint.js'), script('/config.js')],
      }
    },
  }
}

const apiProxy = (target?: string) => (target ? { '/api': target } : undefined)

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss(), yamlPlugin(), manifestHtmlPlugin()],
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, './src') },
  },
  server: {
    // Keycloak only accepts redirects to this port.
    port: 5173,
    strictPort: true,
    // API_PROXY_TARGET in .env.local (see .env.example); without it /api is not proxied.
    proxy: apiProxy(loadEnv(mode, process.cwd(), '').API_PROXY_TARGET),
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
}))
