const sgMail = require('@sendgrid/mail');
const configs = require('../configs');

sgMail.setApiKey(configs.SENDGRID_API_KEY);

module.exports = sgMail;
