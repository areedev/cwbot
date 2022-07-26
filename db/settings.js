var mongoose = require('mongoose');

var schema = mongoose.Schema({
  sentence: { type: String, require: true, default: '' },
  type: { type: String, default: '' },
  account: {type: mongoose.Types.ObjectId, ref: 'accounts'}
});

module.exports = mongoose.model('settings', schema);