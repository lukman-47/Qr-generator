import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import { Shield, Sun, Moon, Copyright } from 'lucide-react';
import logo from './assets/logo.png';

function App() {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light-mode');
    } else {
      document.body.classList.remove('light-mode');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <Router>
      <header className="app-header">
        <img src={logo} alt="Shaikh Lukman Logo" />
      </header>
      <div className="navbar">
        <button 
          onClick={toggleTheme} 
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
      </Routes>
      <footer style={{ textAlign: 'center', padding: '4rem 1rem 2rem', marginTop: 'auto', width: '100%' }}>
        <div className="glass-panel" style={{ padding: '1rem 1.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          <Copyright size={16} />
          <span>All rights reserved by Shaikh Lukman</span>
        </div>
      </footer>
    </Router>
  );
}

export default App;
