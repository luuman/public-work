import './assets/main.css';

import { createApp } from 'vue';
import App from './App.vue';

// 注册 svg-sprite
import 'virtual:svg-icons-register';
import SvgIcon from './components/common/SvgIcon.vue';

createApp(App).component('SvgIcon', SvgIcon).mount('#app');
