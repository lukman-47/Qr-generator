const mongoose = require('mongoose');

const visitorSchema = mongoose.Schema({
  ip: { type: String, required: true },
  city: { type: String, default: 'Unknown' },
  state: { type: String, default: 'Unknown' },
  country: { type: String, default: 'Unknown' },
  browserInfo: { type: String, default: 'Unknown' },
  action: { type: String, required: true }, // 'visit' or 'generate'
}, { timestamps: true });

const Visitor = mongoose.model('Visitor', visitorSchema);
module.exports = Visitor;
