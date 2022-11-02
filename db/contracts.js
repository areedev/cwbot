var mongoose = require('mongoose');

var schema = mongoose.Schema({
  jobId: { type: String, default: '' },
  job: { type: mongoose.Types.ObjectId, ref: 'jobs', default: null },
  proposalId: { type: String, default: '' },
  contractId: { type: String, default: '' },
  clientId: { type: mongoose.Types.ObjectId, ref: 'accounts', default: null },
  clientCwId: { type: String, default: '' },
  workerId: { type: mongoose.Types.ObjectId, ref: 'accounts', default: '' },
  workerCwId: { type: String, default: '' },
  step: { type: Number, default: 0 },
});

module.exports = mongoose.model('contracts', schema);