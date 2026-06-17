import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // esbuild's CSS minifier collapses `backdrop-filter` and
    // `-webkit-backdrop-filter` into one, dropping the unprefixed property.
    // lightningcss is prefix-aware and keeps both, so blur works in
    // Chrome/Edge/Firefox on the production build, not just Safari.
    cssMinify: 'lightningcss',
  },
})
