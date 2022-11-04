var mongoose = require('mongoose');

var schema = mongoose.Schema({
  id: { type: Number, default: 0 },
  status: { type: Number, default: 0 },
  payload: { type: Object, default: null },
  createdAt: { type: Date, default: null }
});

module.exports = mongoose.model('operations', schema);