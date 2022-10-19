var Visits = require('../db/visits')
var Settings = require('../db/settings')
var Accounts = require('../db/accounts')
var Users = require('../db/user')
const { bot, doCertain, delay } = require('../bot')
const moment = require('moment')
const jwt = require('jwt-simple')
const Manuallinks = require('../db/manuallinks')
const BadClients = require('../db/badclients')
const Proxies = require('../db/proxies')
var intervals = [];
var interval = null;
var tickTime;
var period = 5400000
// var period = 5000


const auth = async (req, res, next) => {
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
          req.body.user = user;
          return next()
        }
      }
    }
  }
  return res.json({ success: false, error: 'Invalid user' })
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
    var { id, auto, proxy, bids, auth, cookie } = req.body
    if (proxy == 'null') proxy = null
    await Accounts.findByIdAndUpdate(id, { auto, proxy, bids, cookie, auth })
    res.status(200).send({ success: true })
  } catch (e) {
    console.log(e)
    res.status(400).json({ error: e.message })
  }
}
const getSettings = async (req, res) => {
  try {
    const { id } = req.params
    const account = await Accounts.findById(id)
    var { auth, cookie, bids, proxy, auto } = account
    var tickTime = intervals.find(e => e.id == id) ? intervals.find(e => e.id == id).tickTime : null
    remainedTime = tickTime ? period / 1000 - moment().diff(tickTime, 'seconds') : period / 1000
    const proxies = await Proxies.find()
    res.status(200).send({ settings: { auth, cookie, bids, proxy, auto }, remainedTime, proxies })
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
    var accounts = await Accounts.find({}, 'username');
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
    const proxies = await Proxies.find();
    res.json({ success: true, result: { account, proxies } })
  } catch (e) {
    console.log(e)
    res.status(400).json({ error: e.message })

  }
}
const getAccounts = async (req, res) => {
  try {
    var accounts = await Accounts.find({}, 'username');
    res.json({ success: true, accounts })
  } catch (e) {
    console.log(e)
    res.status(400).json({ error: e.message })
  }
}
const saveCredentials = async (req, res) => {
  try {
    var { id } = req.params
    await Accounts.findByIdAndUpdate(id, { auth: req.body.auth })
    res.json({ success: true })
  } catch (e) {
    console.log(e)
    res.status(400).json({ error: e.message })
  }
}
const saveProxy = async (req, res) => {
  try {
    var { id } = req.params
    await Accounts.findByIdAndUpdate(id, { proxy: req.body.proxy })
    res.json({ success: true })
  } catch (e) {
    console.log(e)
    res.status(400).json({ error: e.message })
  }
}
const setAuto = async (req, res) => {
  try {
    var { id } = req.params
    await Accounts.findByIdAndUpdate(id, { auto: req.body.auto })
    res.json({ success: true })
  } catch (e) {
    console.log(e)
    res.status(400).json({ error: e.message })
  }
}
const saveBids = async (req, res) => {
  try {
    var { id } = req.params
    await Accounts.findByIdAndUpdate(id, { bids: req.body.bids })
    res.json({ success: true })
  } catch (e) {
    console.log(e)
    res.status(400).json({ error: e.message })
  }
}
const makeBlocked = async (req, res) => {
  try {
    var { id } = req.params
    await Accounts.findByIdAndUpdate(id, { blocked: true })
    res.json({ success: true })
  } catch (e) {
    console.log(e)
    res.status(400).json({ error: e.message })
  }
}

const doLogin = async (req, res) => {
  try {
    const { username, password } = req.body
    console.log(username, password)
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
const doManual = async () => {
  try {
    var links = await Manuallinks.find({ processed: false });
    while (links.length > 0) {
      const link = links[0]
      await doCertainBid(link.link, link.type);
      await Manuallinks.findOneAndUpdate({ link: link.link, processed: false }, { processed: true })
      links = await Manuallinks.find({ processed: false })
    }
    await Settings.findOneAndUpdate({ type: 'manual', sentence: 'stopped' })
  } catch (e) {
    console.log(e)
  }
}
const doCertainBid = async (url, type) => {
  try {
    console.log('Doing manual bid to ' + url + '...')
    const accounts = await Accounts.find()
    for (var account of accounts) {
      console.log('Doing account ' + account.username);
      // await delay(1000)
      await doCertain(account._id, url, type);
    }
  } catch (e) {
    console.log(e)
  }
}
const addBadClient = async (req, res) => {
  try {
    var { id } = req.body
    var bc = await BadClients.findOne({ id })
    if (!bc) bc = await BadClients.create({ id })
    res.json({ success: true, result: bc })
  } catch (e) {
    res.json({ success: false });
  }
}
const startManual = async (req, res) => {
  try {
    const { url, type } = req.body
    const link = await Manuallinks.findOne({ link: url, type })
    if (!link)
      await Manuallinks.create({ link: url, type, processed: false });
    var manual = await Settings.findOne({ type: 'manual' });
    if (manual && manual.sentence == 'running')
      return res.json({ success: false, error: 'Already running' });
    else if (!manual)
      manual = await Settings.create({ type: 'manual', sentence: 'running' });
    else
      await Settings.findOneAndUpdate({ type: 'manual', sentence: 'running' });
    res.json({ success: true });
    // doCertainBid(url, type)
    doManual()
  } catch (e) {
    res.json({ success: false });
  }
}
const doAllBid = async () => {
  const accounts = await Accounts.find()
  console.log('here')
  for (const account of accounts) {
    if (account?.auto)
      await bot(account._id);
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

const registerManualLink = async (req, res) => {
  try {
    var link = await Manuallinks.findOne({ link: req.body.url, type: req.body.type })
    if (link) {
      res.json({ success: false, error: 'Already registered' })
    } else {
      link = await Manuallinks.create({ link: req.body.url, processed: false, type: req.body.type })
      res.json({ success: true, result: link })
    }
  } catch (e) {
    console.log(e)
    res.json({ success: false })
  }
}
const getPublicSettings = async (req, res) => {
  try {
    var proxies = await Proxies.find()
    var badClients = await BadClients.find();
    var manualLinks = await Manuallinks.find();
    res.json({ success: true, result: { proxies, badClients, manualLinks } })
  } catch (e) {
    console.log(e)
    res.json({ success: false })
  }
}
const getProxies = async (req, res) => {
  try {
    var proxies = await Proxies.find()
    res.json({ success: true, result: proxies })
  } catch (e) {
    console.log(e)
    res.json({ success: false })
  }
}
const addProxy = async (req, res) => {
  try {
    var { ip, port, type, username, password } = req.body
    console.log(req.body)
    var proxy = await Proxies.findOne({ port, ip })
    if (proxy) return res.json({ success: false, error: 'Ip and port already registered' });
    proxy = await Proxies.create({ ip, port, type, username, password })
    var proxies = await Proxies.find()
    res.json({ success: true, result: proxies })
  } catch (e) {
    console.log(e)
    res.json({ success: false })
  }
}
const updateProxy = async (req, res) => {
  try {
    console.log(req.body)
    var { _id, ip, port, type, username, password } = req.body
    var proxy = await Proxies.findById(_id)
    if (!proxy) return res.json({ success: false, error: 'Invalid id' });
    proxy = await Proxies.findByIdAndUpdate(_id, { ip, port, type, username, password })
    var proxies = await Proxies.find()
    res.json({ success: true, result: proxies })

  } catch (e) {
    console.log(e)
    res.json({ success: false })
  }
}
const removeProxy = async (req, res) => {
  try {
    var { _id } = req.params
    var proxy = await Proxies.findById(_id)
    if (!proxy) return res.json({ success: false, error: 'Invalid id' });
    await Proxies.deleteOne({ _id })
    var proxies = await Proxies.find()
    res.json({ success: true, result: proxies })
  } catch (e) {
    console.log(e)
    res.json({ success: false })
  }
}

const firstpromoterWebhook = async (req, res) => {
  console.log(req.body)
  res.json({});
}

init()
module.exports = {
  auth,
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
  registerManualLink,
  getProxies,
  addProxy,
  updateProxy,
  removeProxy,
  firstpromoterWebhook,
  addBadClient,
  saveCredentials,
  saveProxy,
  setAuto,
  makeBlocked,
  saveBids,
  getPublicSettings
}