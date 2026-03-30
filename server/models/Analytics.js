const mongoose = require('mongoose');

const analyticsSchema = mongoose.Schema({
  metricName: { type: String, required: true, unique: true },
  totalVisits: { type: Number, default: 0 },
  totalGenerated: { type: Number, default: 0 }
}, { timestamps: true });

const Analytics = mongoose.model('Analytics', analyticsSchema);
module.exports = Analytics;
