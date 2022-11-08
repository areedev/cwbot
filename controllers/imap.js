const inbox = require('inbox');
const { simpleParser } = require('mailparser');
var stream = require('stream')
const nodemailer = require('nodemailer');
const axios = require('axios')
const { READ_MAIL_CONFIG } = require('../config');
const Emails = require('../db/mails');
const ImapCreated = require('../db/imapcreated');

var originMail = '', mailIndex = 0
// var mail = nodemailer.createTransport({
//   host: SEND_MAIL_CONFIG.host,
//   // service: SEND_MAIL_CONFIG.service,
//   auth: SEND_MAIL_CONFIG.auth,
//   port: SEND_MAIL_CONFIG.port
// })


const handleMail = async (content, type, message, source, eventEmitter) => {
  if (!content) return;
  // var mailOptions = {
  //   from: `${source} ${message.from.address} <${SEND_MAIL_CONFIG.auth.user}>`,
  //   to: SLACK.MAIL,
  //   subject: message.title
  // }
  const mail = await Emails.findOne({ user: source })
  console.log(message.title, message.from.address, message.to[0].name, `${mail.user.substring(0, mail.user.indexOf('@'))}+${mail.no}@${mail.user.substring(mail.user.indexOf('@') + 1)}`);
  console.log(message.title == '【クラウドワークス】新規会員登録を完了してください')
  console.log(message.from.address == 'no-reply@crowdworks.jp')
  console.log(message.to[0].name == `${mail.user.substring(0, mail.user.indexOf('@'))}+${mail.no}@${mail.user.substring(mail.user.indexOf('@') + 1)}`)
  // if (message.title != '【クラウドワークス】新規会員登録を完了してください' ||
  //   message.from.address != 'no-reply@crowdworks.jp' ||
  //   message.to[0].name != `${mail.user.substring(0, mail.user.indexOf('@'))}+${mail.no}@${mail.user.substring(mail.user.indexOf('@') + 1)}`)
  //   return;
  
  eventEmitter.emit('newmail', { to: message.to[0].name, content })
  // try {
  //   await sentNotification();
  // } catch (e) {
  //   console.log(e);
  // }
  // try {
  //   const res = await mail.sendMail(mailOptions);
  //   console.log('Success to send email', source);
  // } catch (e) {
  //   console.log("Failed to send mail", e)
  // }
}
var client;
const connectImap = async (email, eventEmitter) => {
  console.log(`Connecting to ${email.user} IMAP server...`)
  client = inbox.createConnection(READ_MAIL_CONFIG.imap.port, email.host, {
    secureConnection: true,
    auth: { user: email.user, pass: email.password }
  });
  client.connect();
  client.on("connect", function () {
    console.log(`Successfully connected to ${email.user} IMAP server`);
    eventEmitter.emit('imapstarted', {})
    client.openMailbox("INBOX", function (error, info) {
      if (error) throw error;
      console.log("Message count in INBOX: " + info.count);
    })
  });
  client.on("new", function (message) {
    console.log("New incoming message: " + email.user);
    const stream = client.createMessageStream(message.UID);
    simpleParser(stream, async (err, parsed) => {
      var type = ''
      if (parsed.html) type = 'html'
      else if (parsed.text) type = 'text'
      handleMail(parsed[type], type, message, email.user, eventEmitter);
    });
  });
  client.on('close', function () {
    console.log(`${email.user} DISCONNECTED!`);
    setTimeout(() => {
      connectImap(email);
    }, 3000)
  });
  // setTimeout(() => client.close(), 3000)
}
const startImap = async (origin, eventEmitter) => {
  const email = await Emails.findOne({ user: origin });
  if (!email) return;
  connectImap(email, eventEmitter)
}

const closeImap = async () => {
  client.close();
}
module.exports = { startImap, closeImap }