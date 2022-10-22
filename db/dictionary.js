var mongoose = require('mongoose');

var schema = mongoose.Schema({
  word: { type: String, default: '' },
  translated: { type: String, default: '' },
  category: { type: mongoose.Types.ObjectId, ref: 'category', default: null },
  createdAt: { type: Date, default: null },
});

module.exports = mongoose.model('dictionary', schema);