var mongoose = require('mongoose');

var schema = mongoose.Schema({
  username: { type: String, default: '' },
  auth: { type: Object, default: undefined },
  cookie: { type: String, default: '' },
  bids: { type: Object, default: undefined },
  auto: { type: Boolean, default: false },
  proxy: { type: mongoose.Types.ObjectId, ref: 'proxies' },
  status: { type: String, default: 'stopped' },
});

module.exports = mongoose.model('accounts', schema);