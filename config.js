module.exports.READ_MAIL_CONFIG = {
  imap: {
    user: process.env.EMAIL,
    password: process.env.PASSWORD,
    host: process.env.HOST,
    port: 993,
    authTimeout: 10000,
    tls: true,
    tlsOptions: { rejectUnauthorized: false },
  },
};
