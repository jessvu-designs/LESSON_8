import { createApp } from 'vue'
import './style.css'
import App from './App.vue'

// Vuetify
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import '@mdi/font/css/materialdesignicons.css'

// Vue Router
import { createRouter, createWebHistory } from 'vue-router'
import routes from './router'

const vuetify = createVuetify({
	components,
	directives,
	icons: {
		defaultSet: 'mdi',
	},
})

const router = createRouter({
	history: createWebHistory(),
	routes,
})

createApp(App)
	.use(vuetify)
	.use(router)
	.mount('#app')
