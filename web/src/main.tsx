import { createRoot } from 'react-dom/client';
import { App } from './App';
import { AuthProvider } from './auth';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <AuthProvider>
    <App />
  </AuthProvider>,
);

// 开发模式：改了网页代码后自动刷新
if (__DEV__) {
  const events = new EventSource('/__dev/reload');
  events.addEventListener('reload', () => location.reload());
}
