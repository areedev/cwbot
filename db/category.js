var mongoose = require('mongoose');

var schema = mongoose.Schema({
  name: { type: String, default: '' },
  createdAt: { type: Date, default: null },
});

module.exports = mongoose.model('category', schema);