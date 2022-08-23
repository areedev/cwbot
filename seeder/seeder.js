var mongoose = require('mongoose');
var dbConfig = require('../db/config');
var Settings = require('../db/settings');
var Users = require('../db/user');
mongoose.connect(dbConfig.DB_URL, { useNewUrlParser: true, useUnifiedTopology: true }, async (err) => {
  
  var users = [{
    username: 'admin',
    password: '123123123'
  }]
  await Users.collection.deleteMany();
  await Users.collection.insertMany(users);
  
  process.exit(0);
});