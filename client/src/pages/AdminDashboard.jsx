import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BarChart3, LogOut, Link as LinkIcon, Download } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ totalVisits: 0, totalGenerated: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        navigate('/admin');
        return;
      }

      try {
        const res = await axios.get('/api/analytics', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStats(res.data);
      } catch (err) {
        console.error('Failed to fetch stats', err);
        navigate('/admin'); // Token might be invalid
      }
    };
    fetchStats();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin');
  };

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2><BarChart3 style={{display:'inline', marginRight:'8px', verticalAlign:'middle'}}/> Analytics Dashboard</h2>
        <button className="btn btn-secondary" onClick={handleLogout} style={{ width: 'auto' }}>
          <LogOut size={16} /> Logout
        </button>
      </div>
      
      <div className="glass-panel">
        <h3 style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>Global Traffic & Usage Overview</h3>
        <p style={{ color: '#fff', opacity: 0.8 }}>Real-time statistics of user interactions on the QR Code Generator.</p>
        
        <div className="dashboard-grid">
          <div className="stat-card glass-panel" style={{ padding: '1.5rem' }}>
            <h3><LinkIcon size={16} /> Total Page Visits</h3>
            <p>{stats.totalVisits}</p>
          </div>
          <div className="stat-card glass-panel" style={{ padding: '1.5rem' }}>
            <h3><Download size={16} /> Total Generated</h3>
            <p>{stats.totalGenerated}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
