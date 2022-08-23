var mongoose = require('mongoose');

var schema = mongoose.Schema({
  username: { type: String, default: '' },
  password: { type: String, default: '' },
});

module.exports = mongoose.model('users', schema);