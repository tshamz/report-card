const dotenv = require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'tyler@bvaccel.com',
    pass: 'aiug8330'
  }
});

const tunings = {
  threshold: 0.15,
  unit: 'week',
  amount: 1
};

const requestHeaders = {
  'Accept': 'application/vnd.api+json',
  'Authorization': `Token token=${process.env.CODECLIMATE_TOKEN}`
};

module.exports = {
  transporter,
  tunings,
  requestHeaders
};
