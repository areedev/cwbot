var mongoose = require('mongoose');

var schema = mongoose.Schema({
  skill: { type: String, default: '' },
  createdAt: { type: Date, default: null }
});

module.exports = mongoose.model('skills', schema);