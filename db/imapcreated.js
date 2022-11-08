var mongoose = require('mongoose');

var schema = mongoose.Schema({
  mail: { type: String, default: '' },
  no: { type: Number, default: 0 },
});
module.exports = mongoose.model('imapcreated', schema);