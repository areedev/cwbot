var mongoose = require('mongoose');

var schema = mongoose.Schema({
  user: { type: String, default: '' },
  password: { type: String, default: '' },
  host: { type: String, default: '' },
  no: { type: Number, default: 0 }
});
module.exports = mongoose.model('mails', schema);