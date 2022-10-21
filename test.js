const Accounts = require('./db/accounts');
const Settings = require('./db/settings');
const mongoose = require('mongoose');
const dbConfig = require('./db/config')
const puppeteer = require('puppeteer-extra');

const fun = async () => {
  // mongoose.connect(dbConfig.DB_URL, { useNewUrlParser: true, useUnifiedTopology: true });
  // var accounts = await Accounts.find()
  // for (var account of accounts) {
  //   var id = account._id
  //   const web = (await Settings.findOne({ account: id, type: 'web' })).sentence
  //   const app = (await Settings.findOne({ account: id, type: 'app' })).sentence
  //   const ec = (await Settings.findOne({ account: id, type: 'ec' })).sentence
  //   const sys = (await Settings.findOne({ account: id, type: 'sys' })).sentence
  //   const cookie = (await Settings.findOne({ account: id, type: 'json' })).sentence
  //   const username = (await Settings.findOne({ account: id, type: 'username' })).sentence
  //   const password = (await Settings.findOne({ account: id, type: 'password' })).sentence
  //   const status = (await Settings.findOne({ account: id, type: 'status' }))?.sentence
  //   await Accounts.findByIdAndUpdate(id, { auth: { username, password }, bids: { web, app, ec, sys }, cookie, status })
  // }

  // await Settings.deleteMany({ type: { $not: { $eq: 'auto' } } })
  // process.exit(0)
  var params = {
    headless: false,
    defaultViewport: null
  }
  var args = ['--start-maximized']
  const browser = await puppeteer.launch({ ...params, args, executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' });

}

fun()