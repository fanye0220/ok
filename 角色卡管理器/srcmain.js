import { createApp } from 'vue';
import App from './App.vue';

// 创建Vue应用
const app = createApp(App);

// 全局属性
app.config.globalProperties.$filters = {
  formatDate(timestamp) {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString('zh-CN');
  },
  truncate(text, length = 50) {
    if (!text) return '';
    return text.length > length ? text.substring(0, length) + '...' : text;
  }
};

app.mount('#app');