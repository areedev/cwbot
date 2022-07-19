var mongoose = require('mongoose');

var schema = mongoose.Schema({
  link: { type: String, require: true, default: '' },
  time: { type: mongoose.Schema.Types.Date, default: '' }
});

module.exports = mongoose.model('visits', schema);