var mongoose = require('mongoose');

var schema = mongoose.Schema({
  link: { type: String, default: '' },
  processed: { type: Boolean, default: false },
  type: { type: String, default: 'web' }
});

module.exports = mongoose.model('manuallinks', schema);