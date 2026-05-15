const express = require('express');
const router = express.Router();
const Analytics = require('../models/Analytics');
const Visitor = require('../models/Visitor');
const { protect } = require('../middleware/authMiddleware');

const getOrCreateStats = async () => {
  let stats = await Analytics.findOne({ metricName: 'global_stats' });
  if (!stats) {
    stats = await Analytics.create({ metricName: 'global_stats' });
  }
  return stats;
};

const recordVisitor = async (req, action) => {
  try {
    let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;
    if (ip.includes(',')) ip = ip.split(',')[0].trim();
    if (ip === '::1' || ip === '127.0.0.1') ip = '127.0.0.1';
    
    let city = 'Unknown';
    let state = 'Unknown';
    let country = 'Unknown';
    
    if (ip !== '127.0.0.1') {
      try {
        const response = await fetch(`http://ip-api.com/json/${ip}`);
        const data = await response.json();
        if (data.status === 'success') {
          city = data.city;
          state = data.regionName;
          country = data.country;
        }
      } catch (err) {
        console.error('GeoIP fetch failed:', err.message);
      }
    } else {
      city = 'Localhost';
      state = 'Localhost';
      country = 'Localhost';
    }

    const browserInfo = req.headers['user-agent'] || 'Unknown Browser';

    await Visitor.create({
      ip,
      city,
      state,
      country,
      browserInfo,
      action
    });
  } catch (err) {
    console.error('Visitor record error:', err.message);
  }
};

// @route   POST /api/analytics/visit
// @desc    Increment total visits
router.post('/visit', async (req, res) => {
  try {
    const stats = await getOrCreateStats();
    stats.totalVisits += 1;
    await stats.save();
    
    await recordVisitor(req, 'visit');

    res.status(200).json({ message: 'Visit recorded' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/analytics/generate
// @desc    Increment total QR generated
router.post('/generate', async (req, res) => {
  try {
    const stats = await getOrCreateStats();
    stats.totalGenerated += 1;
    await stats.save();
    
    await recordVisitor(req, 'generate');

    res.status(200).json({ message: 'Generation recorded' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/analytics
// @desc    Get all stats (Admin Only)
router.get('/', protect, async (req, res) => {
  try {
    const stats = await getOrCreateStats();
    res.status(200).json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/analytics/visitors
// @desc    Get all visitors logs (Admin Only)
router.get('/visitors', protect, async (req, res) => {
  try {
    const visitors = await Visitor.find().sort({ createdAt: -1 }).limit(100);
    res.status(200).json(visitors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
