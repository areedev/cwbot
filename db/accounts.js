var mongoose = require('mongoose');

var schema = mongoose.Schema({
  username: { type: String, default: '' },
  auth: { type: Object, default: { username: '', password: '' } },
  cookie: { type: String, default: '' },
  bids: { type: Object, default: { web: '', app: '', sys: '', ec: '' } },
  auto: { type: Boolean, default: false },
  proxy: { type: mongoose.Types.ObjectId, ref: 'proxies' },
  status: { type: String, default: 'stopped' },
  blocked: { type: Boolean, default: false }
});

module.exports = mongoose.model('accounts', schema);