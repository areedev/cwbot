const puppeteer = require('puppeteer-extra');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
const express = require('express')
const app = express()
const http = require('http')
app.set('port', 8000)
const server = http.createServer(app)
const mongoose = require('mongoose');
const { bot } = require('./bot')
const dbConfig = require('./db/config')
mongoose.connect(dbConfig.DB_URL, { useNewUrlParser: true, useUnifiedTopology: true });

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(bodyParser.json({ limit: '50mb', extended: true }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());
app.use(session({ secret: 'secret', resave: true, saveUninitialized: true }));
app.use(express.static(path.join(__dirname, 'public')));
var appRoute = require('./routes/app');

app.use('/', appRoute);

// const interval = 3000
const interval = 3600000


server.listen(8000)
server.on('listening', () => {
  console.log('Listening on 8080')
})
server.on('error', onError)

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}