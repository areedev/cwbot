var mongoose = require('mongoose');

var schema = mongoose.Schema({
  sentence: { type: String, require: true, default: '' },
  type: { type: String, default: '' }
});

module.exports = mongoose.model('bids', schema);