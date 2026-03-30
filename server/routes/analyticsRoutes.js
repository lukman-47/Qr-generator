const express = require('express');
const router = express.Router();
const Analytics = require('../models/Analytics');
const { protect } = require('../middleware/authMiddleware');

const getOrCreateStats = async () => {
  let stats = await Analytics.findOne({ metricName: 'global_stats' });
  if (!stats) {
    stats = await Analytics.create({ metricName: 'global_stats' });
  }
  return stats;
};

// @route   POST /api/analytics/visit
// @desc    Increment total visits
router.post('/visit', async (req, res) => {
  try {
    const stats = await getOrCreateStats();
    stats.totalVisits += 1;
    await stats.save();
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

module.exports = router;
