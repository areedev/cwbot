var mongoose = require('mongoose');
var dbConfig = require('../db/config');
var Settings = require('../db/settings');
var Emails = require('../db/mails');
var Users = require('../db/user');
mongoose.connect(dbConfig.DB_URL, { useNewUrlParser: true, useUnifiedTopology: true }, async (err) => {

  var users = [{
    username: 'admin',
    password: '123123123'
  }]
  // await Users.collection.deleteMany();
  // await Users.collection.insertMany(users);

  var emails = [
    { user: 'omnisuperadm1@gmail.com', password: 'lswonxivivcofkio', host: 'imap.gmail.com', no: 0 },
  ]
  await Emails.collection.deleteMany();
  await Emails.collection.insertMany(emails);

  process.exit(0);
});