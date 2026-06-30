import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './config/api'
import './index.css'
import AOS from 'aos';
import 'aos/dist/aos.css';
import { WebSocketProvider } from './context/WebSocketContext.tsx';



AOS.init({
  duration: 400, 
  once: true,
  easing: 'ease-out-quad',
  offset: 50, 
  delay: 0, 
});



const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error("Root element not found! Check your index.html");
} else {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <WebSocketProvider>
        <App />
      </WebSocketProvider>
    </React.StrictMode>,
  );
}
