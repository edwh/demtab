import { createBootstrap } from 'bootstrap-vue-next'
import 'bootstrap-vue-next/dist/bootstrap-vue-next.css'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(createBootstrap({ components: true, directives: true }))
})
