var express = require('express');
var router = express.Router();
var app = require('../controllers/app')
router.get('/', app.index)
router.get('/:id', app.account)
router.get('/visits/:id', app.visits)
router.get('/settings/:id', app.settings)

router.get('/api/accounts', app.getAccounts)
router.get('/api/account/:id', app.getAccount)
router.post('/api/accounts/add', app.addAccount)
router.post('/api/settings/save', app.saveSettings)
router.get('/api/settings/:id', app.getSettings)
router.get('/api/settings/start/:id', app.start)
router.get('/api/settings/stop/:id', app.stop)
router.get('/api/visits/:limit/:page/:id', app.getVisits)
module.exports = router 