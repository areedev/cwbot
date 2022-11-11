var mongoose = require('mongoose');

var schema = mongoose.Schema({
  name: { type: String, require: true, default: '' },
  color: {type: String, default: '#ffffff'}
});

module.exports = mongoose.model('tags', schema);