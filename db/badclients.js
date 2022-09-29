var mongoose = require('mongoose');

var schema = mongoose.Schema({
  id: { type: String, default: '' },
});

module.exports = mongoose.model('badclients', schema);