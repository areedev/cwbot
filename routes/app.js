var express = require('express');
var router = express.Router();
var app = require('../controllers/app')
router.post('/api/admin/startlocalchrome', app.startLocalChrome)
router.post('/api/admin/login', app.doLogin)
router.use('/api/admin', app.auth)
router.get('/api/admin/loginjwt', app.doLoginjwt)
router.get('/api/admin/logout', app.logout)
router.get('/api/admin/accounts', app.getAccounts)
router.post('/api/admin/account', app.addAccount)
router.get('/api/admin/account/:id', app.getAccount)
router.post('/api/admin/account/credential/:id', app.saveCredentials)
router.post('/api/admin/account/proxy/:id', app.saveProxy)
router.post('/api/admin/account/auto/:id', app.setAuto)
router.post('/api/admin/account/bids/:id', app.saveBids)
router.get('/api/admin/account/blocked/:id', app.makeBlocked)
router.post('/api/admin/account/setclient/:id', app.setClient)
router.get('/api/admin/account/once/:id/:delay', app.once)
router.get('/api/admin/settings', app.getPublicSettings)
router.get('/api/admin/settings/proxy', app.getProxies)
router.post('/api/admin/settings/proxy', app.updateProxy)
router.delete('/api/admin/settings/proxy/:_id', app.removeProxy)
router.post('/api/admin/settings/proxy/add', app.addProxy)
router.post('/api/admin/settings/badclient', app.addBadClient)
router.post('/api/admin/settings/manual/register', app.registerManualLink)
router.post('/api/admin/settings/manual/start', app.startManual)
router.post('/api/admin/settings/manual/mark/:id', app.markManualLink)
router.post('/api/admin/settings/keyword/add', app.addKeyword)
router.delete('/api/admin/settings/keyword/:id', app.deleteKeyword)
router.post('/api/admin/settings/dictionary/category/add', app.addCategory)
router.post('/api/admin/settings/dictionary/word/add/:id?', app.addWord)
// router.post('/api/admin/settings/dictionary/word/edit', app.editWord)

router.post('/webhook', app.firstpromoterWebhook)
module.exports = router 