const dotenv = require('dotenv').config();
const moment = require('moment');
const request = require('request-promise');
const nodemailer = require('nodemailer');
const repos = require('./repos.js');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'tyler@bvaccel.com',
    pass: 'aiug8330'
  }
});

const now = moment().format('YYYY-MM-DD');
const then = moment().subtract(1, 'week').format('YYYY-MM-DD');

const bigMoverThreshold = 0.15;

const options = {
  json: true,
  headers: {
    'Accept': 'application/vnd.api+json',
    'Authorization': `Token token=${process.env.CODECLIMATE_TOKEN}`
  }
};

const getData = () => {
  const requests = repos.map(repo => {
    const url = `https://api.codeclimate.com/v1/repos/${repo.id}/metrics/gpa?filter[from]=${then}&filter[to]=${now}`;
    return request(url, options).then(response => {
      const then = response.data.attributes.points[0].value;
      const now = response.data.attributes.points[1].value;
      return {
        name: repo.name,
        gpa: {
          then: (then === null) ? then : then.toFixed(3),
          now: (now === null) ? now : now.toFixed(3)
        }
      }
    });
  });
  return Promise.all(requests)
};

const filterNulls = data => {
  return data.filter(item => item.gpa.now !== null && item.gpa.then !== null);
};

const filterBigMovers = data => {
  return data.filter(item => Math.abs(item.gpa.then - item.gpa.now) > bigMoverThreshold);
};

const createChangeTable = data => {
  let tableBody;
  const tableStyle = 'style="border-collapse: collapse; border: solid #e0e0dc; border-width: 1px 0 0 1px; width: 100%;"'
  const headCellStyle = 'style="border: solid #e0e0dc; border-width: 0 1px 1px 0; padding: 6px 8px; text-align: left;background: rgba(212,221,228,.5);"'
  const cellStyle = 'style="border: solid #e0e0dc; border-width: 0 1px 1px 0; padding: 6px 8px; text-align: left;"'
  const tableHead = `<thead><tr><th ${headCellStyle}>Repo</th><th ${headCellStyle}>Then</th><th ${headCellStyle}>Now</th><th ${headCellStyle}>Change</th></tr></thead>`;

  if (data.length > 0) {
    tableBody = data.reduce((string, item) => {
      const direction = ((item.gpa.now - item.gpa.then) > 0) ? '⬆️' : '⬇️';
      const name = `<td ${cellStyle}>${item.name}</td>`;
      const then = `<td ${cellStyle}>${item.gpa.then}</td>`;
      const now = `<td ${cellStyle}>${item.gpa.now}</td>`;
      const change = `<td ${cellStyle}>${direction} ${Math.abs((item.gpa.now - item.gpa.then).toFixed(3))}</td>`;
      return `${string}<tr>${name}${then}${now}${change}</tr>`;
    }, '');
  } else {
    tableBody = `<tr><td>Move along...nothing to see here.</td><td></td><td></td><td></td></tr>`;
  }

  return `<table ${tableStyle}>${tableHead}<tbody>${tableBody}</tbody></table>`;
};

const createEmailString = table => {
  return `<div style="width: 600px; margin: 0 auto;"><h2 style="font-size: 34px;">Howdy!</h2>Just what you were hoping for! Another email! In this email we'll take a look at recent changes in our project's CodeClimate GPAs and call out the ones with big movements. I bet you thought you were done getting grades and report cards after you finished school! Well, think again!<br><br>A few notes: The CodeClimate API is still in beta so it's unpredictable and undocumented. As such, I can't guarantee the accuracy of this email, but hopefully one day it grows into a <a href="https://www.youtube.com/watch?v=PDBBCuw_Rpc">delicate little flower.</a><br><br><h2 style="font-size: 34px;"><u>Movers and Shakers</u></h2>Here are the big changes from the last week:<br><br>${table}<br><br>---<br><br>Boy, wasn't that some good data?!?? Be on the lookout for this same email next week!<br><br>Until then, stay sexy and don't get murdered yall!</div>`;
};

const sendEmail = emailString => {
  const mailOptions = {
    from: '"The Dean\'s Office" <tyler@bvaccel.com>', // sender address
    to: 'delivery@bvaccel.com',
    cc: 'tyler@bvaccel.com, annie@bvaccel.com',
    subject: `🎒 BVA Weekly Report Card for ${moment().format('MMMM Do, YYYY')}`,
    html: emailString
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return console.log(error);
    }
    console.log('Message %s sent: %s', info.messageId, info.response);
  });
};

const doSomethign = function () {
  if (moment().day() === 2) {
    console.log('it\'s Tuesday!');
    getData()
      .then(filterNulls)
      .then(filterBigMovers)
      .then(createChangeTable)
      .then(createEmailString)
      .then(sendEmail);
  } else {
    console.log('it\'s not Tuesday.');
  };
  return;
};

doSomethign();
