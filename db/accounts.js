var mongoose = require('mongoose');

var schema = mongoose.Schema({
  username: { type: String, default: '' }
});

module.exports = mongoose.model('accounts', schema);