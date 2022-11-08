var mongoose = require('mongoose');

var schema = mongoose.Schema({
  user: { type: String, default: '' },
  password: { type: String, default: '' },
  host: { type: String, default: '' },
});
module.exports = mongoose.model('mails', schema);