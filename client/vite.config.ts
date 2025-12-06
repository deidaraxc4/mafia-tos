import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  process.env = { ...process.env, ...env };

  return {
    plugins: [react()],
    define: {
    'process.env': {
          // Use nullish coalescing (??) as a fallback if process.env.VAR is undefined, 
          // ensuring the final value passed to JSON.stringify is a string or null/undefined.
          NODE_ENV: JSON.stringify(process.env.NODE_ENV ?? 'development'),
          // REACT_APP_API_URL: JSON.stringify(process.env.REACT_APP_API_URL ?? ''),
          REACT_APP_API_URL: JSON.stringify(
                    process.env.REACT_APP_API_URL || env.REACT_APP_API_URL
                ),
          REACT_APP_VERSION_SHA: JSON.stringify(process.env.REACT_APP_VERSION_SHA ?? 'foobar3'),
      },
    },
    }
})
