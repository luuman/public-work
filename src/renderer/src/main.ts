import './assets/main.css'
import { createApp } from 'vue'
import App from './App.vue'
import { createI18n } from 'vue-i18n'
import { createPinia } from 'pinia'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'
import router from './router'
import locales from './i18n'

const i18n = createI18n({
  locale: 'zh-CN',
  fallbackLocale: 'en-US',
  legacy: false,
  messages: locales,
})

// 注册 svg-sprite
import 'virtual:svg-icons-register'
import SvgIcon from './components/common/SvgIcon.vue'

const pinia = createPinia()
const app = createApp(App)

app.component('SvgIcon', SvgIcon)
app.use(pinia)
app.use(router)
app.use(i18n)
app.mount('#app')
