var mongoose = require('mongoose');

var schema = mongoose.Schema({
  link: { type: String, require: true, default: '' },
  time: { type: mongoose.Schema.Types.Date, default: '' },
  account: {type: mongoose.Types.ObjectId, ref: 'accounts'}
});

module.exports = mongoose.model('visits', schema);