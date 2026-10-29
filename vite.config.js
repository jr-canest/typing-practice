import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Lives at homeschool.jrcanest.co/typing (the homeschool hub Worker in Apps/Science Lessons
// serves dist/typing). Deploy: npm run deploy.
export default defineConfig({
  base: '/typing/',
  plugins: [react(), tailwindcss()],
})
