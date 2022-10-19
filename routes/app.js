var express = require('express');
var router = express.Router();
var app = require('../controllers/app')
router.post('/api/admin/login', app.doLogin)
router.use('/api/admin', app.auth)
router.get('/api/admin/loginjwt', app.doLoginjwt)
router.get('/api/admin/accounts', app.getAccounts)
router.post('/api/admin/account', app.addAccount)
router.get('/api/admin/account/:id', app.getAccount)
router.post('/api/admin/account/credential/:id', app.saveCredentials)
router.post('/api/admin/account/proxy/:id', app.saveProxy)
router.post('/api/admin/account/auto/:id', app.setAuto)
router.post('/api/admin/account/bids/:id', app.saveBids)
router.get('/api/admin/account/blocked/:id', app.makeBlocked)
router.get('/api/admin/account/once/:id', app.once)
router.get('/api/admin/settings', app.getPublicSettings)
router.get('/api/admin/settings/proxy', app.getProxies)
router.post('/api/admin/settings/proxy', app.updateProxy)
router.delete('/api/admin/settings/proxy/:_id', app.removeProxy)
router.post('/api/admin/settings/proxy/add', app.addProxy)
router.post('/api/admin/settings/badclient', app.addBadClient)
router.post('/api/admin/settings/manual/register', app.registerManualLink)
router.post('/api/admin/settings/manual/start', app.startManual)


router.get('/login', app.login)
router.get('/visits/:id?', app.visits)
router.get('/settings/:id?', app.settings)
router.get('/register', app.register)
router.get('/manual', app.manual)
// router.get('/:id', app.account)


router.get('/api/logout', app.logout)
router.post('/api/settings/save', app.saveSettings)
router.get('/api/settings/:id', app.getSettings)
router.get('/api/settings/start/:id', app.start)
router.get('/api/settings/stop/:id', app.stop)
router.get('/api/visits/:limit/:page/:id', app.getVisits)
router.post('/api/manual/toggle', app.toggleAuto)
router.get('/api/auto', app.getAuto)


router.post('/webhook', app.firstpromoterWebhook)
module.exports = router 