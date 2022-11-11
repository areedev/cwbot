var mongoose = require('mongoose');

var schema = mongoose.Schema({
  username: { type: String, default: '' },
  auth: { type: Object, default: { username: '', password: '' } },
  cookie: { type: String, default: '' },
  bids: { type: Object, default: { web: '', app: '', sys: '', ec: '' } },
  auto: { type: Boolean, default: false },
  proxy: { type: mongoose.Types.ObjectId, ref: 'proxies', default: null },
  tagId: { type: mongoose.Types.ObjectId, ref: 'tags', default: null },
  status: { type: String, default: 'stopped' },
  blocked: { type: Boolean, default: false },
  client: { type: Boolean, default: false },
  cwid: { type: String, default: '' },
  imgPath: { type: String, default: '' },
  tag: { type: String, default: '' }
});

module.exports = mongoose.model('accounts', schema);