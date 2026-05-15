import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BarChart3, LogOut, Link as LinkIcon, Download } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ totalVisits: 0, totalGenerated: 0 });
  const [visitors, setVisitors] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        navigate('/admin');
        return;
      }

      try {
        const resStats = await axios.get('/api/analytics', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStats(resStats.data);

        const resVisitors = await axios.get('/api/analytics/visitors', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setVisitors(resVisitors.data);
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

      <div className="glass-panel" style={{ marginTop: '2rem' }}>
        <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-muted)' }}>Recent Visitors</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--accent-color)' }}>
                <th style={{ padding: '1rem' }}>Date</th>
                <th style={{ padding: '1rem' }}>IP Address</th>
                <th style={{ padding: '1rem' }}>Location</th>
                <th style={{ padding: '1rem' }}>Browser / OS</th>
                <th style={{ padding: '1rem' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {visitors.map((visitor, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{new Date(visitor.createdAt).toLocaleString()}</td>
                  <td style={{ padding: '1rem' }}>{visitor.ip}</td>
                  <td style={{ padding: '1rem' }}>{visitor.city}, {visitor.state}</td>
                  <td style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{visitor.browserInfo.substring(0, 50)}...</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ 
                      padding: '0.25rem 0.75rem', 
                      borderRadius: '999px', 
                      fontSize: '0.85rem', 
                      fontWeight: 600,
                      background: visitor.action === 'generate' ? 'rgba(37, 211, 102, 0.2)' : 'rgba(99, 102, 241, 0.2)',
                      color: visitor.action === 'generate' ? '#4ade80' : '#818cf8'
                    }}>
                      {visitor.action.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
              {visitors.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No visitors recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
