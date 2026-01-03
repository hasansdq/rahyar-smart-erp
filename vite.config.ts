import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    define: {
      // This ensures process.env.API_KEY works in the client-side code
      // as required by the coding guidelines.
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      // Polyfill for other potential process.env usage
      'process.env': {}
    },
    server: {
      port: 3000
    }
  };
});