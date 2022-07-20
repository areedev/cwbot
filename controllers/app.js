var Visits = require('../db/visits')
var Settings = require('../db/settings')
const { bot } = require('../bot')
const moment = require('moment')
var interval;
var tickTime;
var period = 5400000


const index = (req, res) => {
  res.render('index')
}

const visits = (req, res) => {
  res.render('visits')
}
const settings = (req, res) => {
  res.render('settings')
}

const getVisits = async (req, res) => {
  const { limit, page } = req.params
  const visits = await Visits.find({}).sort([['time', -1]]).skip(page * limit).limit(limit)
  const count = await Visits.countDocuments()
  res.status(200).send({ visits, count })
}
const saveSettings = async (req, res) => {
  try {
    const { web, app, ec, json } = req.body
    await Settings.updateOne({ type: 'web' }, { sentence: web })
    await Settings.updateOne({ type: 'app' }, { sentence: app })
    await Settings.updateOne({ type: 'ec' }, { sentence: ec })
    await Settings.updateOne({ type: 'json' }, { sentence: json })
    res.status(200).send({ web, app, ec, json })
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
}
const getSettings = async (req, res) => {
  try {
    const settings = await Settings.find({})
    remainedTime = period / 1000 - moment().diff(tickTime, 'seconds')
    res.status(200).send({ settings, remainedTime })
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
}
const bott = () => {
  console.log("tick...")
}
const start = async (req, res) => {
  try {
    var running = await Settings.findOne({ type: 'status' })
    if (running.sentence == 'running') return res.status(200).send('running')
    running.sentence = 'running'
    await running.save()
    tickTime = moment()
    bot()
    interval = setInterval(() => {
      tickTime = moment()
      bot()
    }, period)
    res.status(200).send('running')
  } catch (e) {
    console.log(e)
    res.status(400).json({ error: e.message })
  }
}
const stop = async (req, res) => {
  try {
    var running = await Settings.findOne({ type: 'status' })
    if (running.sentence == 'stopped') return res.status(200).send('stopped')
    running.sentence = 'stopped'
    await running.save()
    clearInterval(interval)
    res.status(200).send('stopped')
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
  visits,
  settings,
  getVisits,
  saveSettings,
  getSettings,
  start,
  stop
}