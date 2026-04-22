import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      '/api/flipkart': {
        target: 'https://2.rome.api.flipkart.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/flipkart/, '/api/4/page/fetch'),
        headers: {
          'Origin': 'https://www.flipkart.com',
          'Referer': 'https://www.flipkart.com/',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36',
          'x-user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 FKUA/website/42/website/Desktop',
          'flipkart_secure': 'true'
        }
      }
    }
  }
})
