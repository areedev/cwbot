var express = require('express');
var router = express.Router();
var app = require('../controllers/app')
router.post('/api/login', app.doLogin)
router.use('/', app.index)
router.get('/api/loginjwt', app.doLoginjwt)
router.get('/login', app.login)
router.get('/visits/:id?', app.visits)
router.get('/settings/:id?', app.settings)
router.get('/register', app.register)
// router.get('/:id', app.account)


router.get('/api/logout', app.logout)
router.get('/api/accounts', app.getAccounts)
router.get('/api/account/:id', app.getAccount)
router.post('/api/accounts/add', app.addAccount)
router.post('/api/settings/save', app.saveSettings)
router.get('/api/settings/:id', app.getSettings)
router.get('/api/settings/start/:id', app.start)
router.get('/api/settings/stop/:id', app.stop)
router.get('/api/visits/:limit/:page/:id', app.getVisits)

router.post('/webhook', app.firstpromoterWebhook)
module.exports = router 