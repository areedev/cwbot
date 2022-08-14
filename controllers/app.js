var Visits = require('../db/visits')
var Settings = require('../db/settings')
var Accounts = require('../db/accounts')
const { bot } = require('../bot')
const moment = require('moment')
var intervals = [];
var period = 5400000
// var period = 10000


const index = (req, res) => {
  res.render('index')
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

const getVisits = async (req, res) => {
  const { limit, page, id } = req.params
  const visits = await Visits.find({ account: id }).sort([['time', -1]]).skip(page * limit).limit(limit)
  const count = await Visits.countDocuments({ account: id })
  res.status(200).send({ visits, count })
}
const saveSettings = async (req, res) => {
  try {
    const { web, app, ec, json, id } = req.body
    console.log(id)
    var setting = await Settings.findOne({ account: id })
    if (setting) {
      await Settings.updateOne({ type: 'web', account: id }, { sentence: web })
      await Settings.updateOne({ type: 'app', account: id }, { sentence: app })
      await Settings.updateOne({ type: 'ec', account: id }, { sentence: ec })
      await Settings.updateOne({ type: 'json', account: id }, { sentence: json })
    } else {
      await Settings.create({ type: 'web', account: id, sentence: web })
      await Settings.create({ type: 'app', account: id, sentence: app })
      await Settings.create({ type: 'ec', account: id, sentence: ec })
      await Settings.create({ type: 'json', account: id, sentence: json })
      await Settings.create({ type: 'status', account: id, sentence: 'stopped' })
    }
    res.status(200).send({ web, app, ec, json, id })
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
}
const getSettings = async (req, res) => {
  try {
    const { id } = req.params
    const settings = await Settings.find({ account: id })
    var tickTime = intervals.find(e => e.id == id) ? intervals.find(e => e.id == id).tickTime : null
    remainedTime = tickTime ? period / 1000 - moment().diff(tickTime, 'seconds') : period / 1000
    res.status(200).send({ settings, remainedTime })
  } catch (e) {
    console.log(e)
    res.status(400).json({ error: e.message })
  }
}
const bott = (id) => {
  console.log(id + " tick...")
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
const init = async () => {
  console.log('init')
  const status = await Settings.findOneAndUpdate({ type: 'status' }, { sentence: 'stopped' })
}
init()
module.exports = {
  index,
  account,
  visits,
  register,
  settings,
  getVisits,
  saveSettings,
  getSettings,
  start,
  stop,
  addAccount,
  getAccounts,
  getAccount,
  
}