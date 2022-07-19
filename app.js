const puppeteer = require('puppeteer-extra');
const express = require('express')
const app = express()
const http = require('http')
const server = http.createServer(app)
const mongoose = require('mongoose');
const bot = require('./bot')
const dbConfig = require('./db/config')
mongoose.connect(dbConfig.DB_URL, { useNewUrlParser: true, useUnifiedTopology: true });

bot.bot()