var express = require('express');
var router = express.Router();
var app = require('../controllers/app')
router.get('/', app.index)
router.get('/visits', app.visits)
router.get('/settings', app.settings)
router.post('/api/settings/save', app.saveSettings)
router.get('/api/settings', app.getSettings)
router.get('/api/settings/start', app.start)
router.get('/api/settings/stop', app.stop)
router.get('/api/visits/:limit/:page', app.getVisits)
module.exports = router 