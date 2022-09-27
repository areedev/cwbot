var mongoose = require('mongoose');

var schema = mongoose.Schema({
  username: { type: String, default: '' },
  password: { type: String, default: '' },
  type: { type: String, default: '' },
  port: { type: String, default: '' },
  ip: { type: String, default: '' },
});

module.exports = mongoose.model('proxies', schema);