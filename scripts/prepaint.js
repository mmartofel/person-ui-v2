// Applies the stored theme and language before the first paint (same rules as src/components/app/theme and
// src/i18n/index.ts). Served as /prepaint.js by the manifestHtmlPlugin in vite.config.ts, which appends the call with
// the languages of ui-manifest.yaml app.languages. A file, not an inline script, so the CSP needs no 'unsafe-inline'.
function prepaint(langs) {
  try {
    var t = localStorage.getItem('theme')
    if (t === 'dark' || (t !== 'light' && matchMedia('(prefers-color-scheme: dark)').matches))
      document.documentElement.classList.add('dark')
    var l = localStorage.getItem('lang')
    if (langs.indexOf(l) < 0) {
      l = (navigator.languages || []).map(function (x) { return x.slice(0, 2).toLowerCase() })
        .filter(function (x) { return langs.indexOf(x) >= 0 })[0] || langs[0]
    }
    document.documentElement.lang = l
  } catch (e) {}
}
