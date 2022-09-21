var Visits = require('../db/visits')
var Settings = require('../db/settings')
var Accounts = require('../db/accounts')
var Users = require('../db/user')
const { bot, doCertain } = require('../bot')
const moment = require('moment')
const jwt = require('jwt-simple')
var intervals = [];
var interval = null;
var tickTime;
var period = 5400000
// var period = 5000


const index = async (req, res, next) => {
  var { cookie } = req.headers
  if (cookie) {
    var output = {};
    cookie.split(/\s*;\s*/).forEach(function (pair) {
      pair = pair.split(/\s*=\s*/);
      output[pair[0]] = pair.splice(1).join('=');
    });
    if (output.token) {
      var payload = jwt.decode(output.token, '12345678')
      if (payload._id) {
        const user = await Users.findById(payload._id)
        if (user) {
          if (req.url == '/')
            return res.render('index')
          else {
            req.body.user = user;
            return next()
          }
        }
      }
    }
  }
  if (req.url == '/login')
    return res.render('login')
  else if (req.url.indexOf('api') >= 0) {
    return res.status(400).json({ success: false, error: 'Invalid user' })
  }
  else
    return res.redirect('/login')
}
const login = (req, res) => {
  return res.render('login')
}
const account = (req, res) => {
  res.render('account', { id: req.params.id })
}

const visits = (req, res) => {
  res.render('visits', { id: req.params.id })
}
const settings = (req, res) => {
  res.render('settings', { id: req.params.id })
}

const register = (req, res) => {
  console.log(req.query)
  res.render('register')
}
const manual = (req, res) => {
  res.render('manual', { id: req.params.id })
}
const getVisits = async (req, res) => {
  const { limit, page, id } = req.params
  const visits = await Visits.find({ account: id }).sort([['time', -1]]).skip(page * limit).limit(limit)
  const count = await Visits.countDocuments({ account: id })
  res.status(200).send({ visits, count })
}
const saveSettings = async (req, res) => {
  try {
    const { id, auto } = req.body
    const types = ['web', 'app', 'sys', 'ec', 'json', 'username', 'password']

    for (var type of types) {
      var setting = await Settings.findOne({ account: id, type })
      if (setting) {
        await Settings.updateOne({ type, account: id }, { sentence: req.body[type] })
      } else {
        await Settings.create({ type, account: id, sentence: req.body[type] })
      }
    }
    await Accounts.findByIdAndUpdate(id, { auto })
    res.status(200).send({ success: true })
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
}
const getSettings = async (req, res) => {
  try {
    const { id } = req.params
    const settings = await Settings.find({ account: id })
    const auto = (await Accounts.findById(id)).auto
    var tickTime = intervals.find(e => e.id == id) ? intervals.find(e => e.id == id).tickTime : null
    remainedTime = tickTime ? period / 1000 - moment().diff(tickTime, 'seconds') : period / 1000
    res.status(200).send({ settings, remainedTime, auto })
  } catch (e) {
    console.log(e)
    res.status(400).json({ error: e.message })
  }
}
const bott = (id) => {
  console.log(id + " tick...")
}
const once = async (req, res) => {
  try {
    var { id } = req.params
    bot(id)
    res.status(200).send('success')
  } catch (e) {
    console.log(e)
    res.status(400).json({ error: e.message })
  }
}
const start = async (req, res) => {
  try {
    var { id } = req.params
    var running = await Settings.findOne({ type: 'status', account: id })
    if (running.sentence == 'running') return res.status(200).send('running')
    running.sentence = 'running'
    await running.save()
    var tickTime = moment()
    bot(id)
    var interval = setInterval(() => {
      intervals[intervals.findIndex(e => e.id == id)].tickTime = moment()
      bot(id)
    }, period)
    intervals.push({ id, interval, tickTime })
    res.status(200).send('running')
  } catch (e) {
    console.log(e)
    res.status(400).json({ error: e.message })
  }
}
const stop = async (req, res) => {
  try {
    var { id } = req.params
    var running = await Settings.findOne({ type: 'status', account: id })
    if (running.sentence == 'stopped') return res.status(200).send('stopped')
    running.sentence = 'stopped'
    await running.save()
    clearInterval(intervals.find(e => e.id == id).interval)
    intervals = intervals.filter(e => e.id != id)
    res.status(200).send('stopped')
  } catch (e) {
    console.log(e)
    res.status(400).json({ error: e.message })
  }
}
const addAccount = async (req, res) => {
  try {
    var { username } = req.body
    if (!username) return res.status(400).json({ success: false, error: 'Username is required' })
    await Accounts.create({ username })
    var accounts = await Accounts.find();
    res.json({ success: true, accounts })
  } catch (e) {
    console.log(e)
    res.status(400).json({ error: e.message })

  }
}
const getAccount = async (req, res) => {
  try {
    var { id } = req.params
    if (!id) return res.status(400).json({ success: false, error: 'id is required' })
    var account = await Accounts.findById(id);
    res.json({ success: true, account })
  } catch (e) {
    console.log(e)
    res.status(400).json({ error: e.message })

  }
}
const getAccounts = async (req, res) => {
  try {
    var accounts = await Accounts.find();
    res.json({ success: true, accounts })
  } catch (e) {
    console.log(e)
    res.status(400).json({ error: e.message })
  }
}

const doLogin = async (req, res) => {
  try {
    const { username, password } = req.body
    var user = await Users.findOne({ username, password })
    if (user) {
      var token = jwt.encode({ _id: user._id }, '12345678')
      res.cookie('token', token, { maxAge: 86400000 }).json({ success: true, result: { _id: user._id } })
    } else
      res.status(400).json({ success: false, error: 'Invalid user' })
  } catch (e) {
    console.log(e)
    res.status(400).json({ error: e.message })
  }
}
const doLoginjwt = async (req, res) => {
  console.log('doing login', req.body.user)
  res.json({ success: true })
}
const logout = async (req, res) => {
  console.log('doing logout', req.body.user)
  res.cookie('token', '').json({ success: true })
}
const init = async () => {
  console.log('init')
  const status = await Settings.findOneAndUpdate({ type: 'status' }, { sentence: 'stopped' })
}
const startManual = async (req, res) => {
  try {
    const { url, type } = req.body
    console.log('Doing manual bid to ' + url + '...')
    const accounts = await Accounts.find()
    for (var account of accounts) {
      console.log('Doing account' + account.username);
      await doCertain(account._id, url, type);
    }
    res.json({ success: true })
  } catch (e) {
    res.json({ success: false })
  }
}
const doAllBid = async () => {
  const accounts = await Accounts.find()
  for (const account of accounts) {
    if (account?.auto)
      await bott(account._id);
  }
}
const startAuto = async () => {
  tickTime = moment()
  interval = setInterval(() => {
    tickTime = moment()
    doAllBid();
  }, period)
}
const stopAuto = async () => {
  if (interval) clearInterval(interval)
  tickTime = null
}

const toggleAuto = async (req, res) => {
  try {
    var auto = await Settings.findOne({ type: 'auto' });
    if (!auto) {
      auto = await Settings.create({ type: 'auto', sentence: 'false' });
    }
    if (auto.sentence == 'false') {
      await Settings.findOneAndUpdate({ type: 'auto' }, { sentence: 'true' })
      var remainedTime = period / 1000 - moment().diff(moment(), 'seconds')
      res.json({ result: true, remainedTime })
      startAuto()
    } else if (auto.sentence == 'true') {
      await Settings.findOneAndUpdate({ type: 'auto' }, { sentence: 'false' })
      res.json({ result: false })
      stopAuto()
    }
  } catch (e) {
    res.json({ success: false })
  }
}

const getAuto = async (req, res) => {
  const auto = await Settings.findOne({ type: 'auto' });
  console.log(tickTime)
  var remainedTime = tickTime ? period / 1000 - moment().diff(tickTime, 'seconds') : period / 1000

  if (!auto) {
    res.json({ result: false })
  } else {
    if (auto.sentence == 'false')
      res.json({ result: false })
    else
      res.json({ result: true, remainedTime })
  }
}
const firstpromoterWebhook = async (req, res) => {
  console.log(req.body)
  res.json({});
}

init()
module.exports = {
  index,
  login,
  account,
  visits,
  register,
  manual,
  settings,
  getVisits,
  saveSettings,
  getSettings,
  start,
  stop,
  addAccount,
  getAccounts,
  getAccount,
  doLogin,
  doLoginjwt,
  logout,
  startManual,
  once,
  toggleAuto,
  getAuto,
  firstpromoterWebhook
}