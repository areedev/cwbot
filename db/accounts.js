var mongoose = require('mongoose');

var schema = mongoose.Schema({
  username: { type: String, default: '' },
  auto: { type: Boolean, default: false }
});

module.exports = mongoose.model('accounts', schema);