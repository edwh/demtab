export default defineNuxtConfig({
  ssr: false,

  app: {
    head: {
      title: 'Display',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' }
      ]
    }
  },

  modules: ['@pinia/nuxt'],

  css: ['bootstrap/dist/css/bootstrap.min.css'],

  runtimeConfig: {
    public: {
      apiBase: 'http://localhost:80/api'
    }
  },

  devtools: { enabled: false },

  compatibilityDate: '2025-01-10',

  vite: {
    server: {
      hmr: {
        clientPort: 3000
      },
      host: true
    }
  }
})
