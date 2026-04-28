import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import process from 'node:process'

// https://vite.dev/config/
export default defineConfig(() => {
  return {
    base: process.env.VITE_BASE || '/',
    plugins: [react()],
  }
})
