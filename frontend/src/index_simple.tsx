import React from 'react';
import ReactDOM from 'react-dom/client';
import SimpleApp from './SimpleApp';
import 'antd/dist/reset.css';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <SimpleApp />
  </React.StrictMode>
);
