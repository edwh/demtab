export default defineNuxtConfig({
  ssr: false,

  app: {
    baseURL: '/admin',
    head: {
      title: 'Display Admin',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' }
      ]
    }
  },

  modules: ['@pinia/nuxt'],

  css: [
    'bootstrap/dist/css/bootstrap.min.css',
    'bootstrap-vue-next/dist/bootstrap-vue-next.css'
  ],

  runtimeConfig: {
    public: {
      apiBase: '/api'
    }
  },

  devtools: { enabled: true },

  compatibilityDate: '2025-01-10',

  build: {
    transpile: ['bootstrap-vue-next']
  },

  vite: {
    server: {
      hmr: {
        clientPort: 3001
      },
      host: true
    }
  }
})
