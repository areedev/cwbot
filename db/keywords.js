var mongoose = require('mongoose');

var schema = mongoose.Schema({
  keyword: { type: String, default: '' },
  createdAt: { type: Date, default: null }
});

module.exports = mongoose.model('keywords', schema);