import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const env = {};

// 1. Manually expose NODE_ENV (crucial for local/production detection)
env.NODE_ENV = JSON.stringify(process.env.NODE_ENV);

// 2. Expose specific custom variables used in the frontend
//    These variables must be prefixed with REACT_APP_ (or VITE_ if you switch convention)
//    and any other custom variables you need.
env.REACT_APP_API_URL = JSON.stringify(process.env.REACT_APP_API_URL);
env.REACT_APP_VERSION_SHA = JSON.stringify(process.env.REACT_APP_VERSION_SHA);

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // 1. Define 'process.env' to fix the ReferenceError
    //    Vite will inject this object, allowing library code to access process.env.
    'process.env': env, 
    
    // // 2. Explicitly define NODE_ENV (often required by libraries for development checks)
    // 'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    
  },
})
