var mongoose = require('mongoose');

var schema = mongoose.Schema({
  title: { type: String, default: '' },
  clientId: { type: mongoose.Types.ObjectId, ref: 'accounts', default: null },
  cwid: { type: String, default: '' },
});

module.exports = mongoose.model('jobs', schema);