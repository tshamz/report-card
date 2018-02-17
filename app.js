const url = require('url');
const moment = require('moment');
const fetch = require('node-fetch');

const repos = require('./repos.js');
const { transporter, tunings, requestHeaders: headers } = require('./config');

const dates = {
  now: moment().format('YYYY-MM-DD'),
  then: moment().subtract(tunings.amount, tunings.unit).format('YYYY-MM-DD'),
  pretty: moment().format('MMMM Do, YYYY')
};

const API_BASE = 'https://api.codeclimate.com/v1';

const filterNulls = data => {
  return data.filter(item => item.gpa.now !== null && item.gpa.then !== null);
};

const filterBigMovers = data => {
  return data.filter(item => Math.abs(item.gpa.then - item.gpa.now) > reportCardOptions.threshold);
};

const getOrgs = () => {
  return fetch(`${API_BASE}/orgs`, { headers })
    .then(response => response.json());
};

const getRepos = async id => {
  return fetch(`${API_BASE}/orgs/${id}/repos?page[size]=100`, { headers })
    .then(response => response.json());
};

const getGpas = async repos => {
  // const requests = repos.map(({ id, name }) => {
  const requests = repos.map(({ id, attributes: { human_name: name }}) => {
    console.log(id);
    console.log(name);
    const url = `${API_BASE}/repos/${id}/metrics/gpa?filter[from]=${dates.then}&filter[to]=${dates.now}`;
    return fetch(url, { headers })
      .then(response => response.json())
      .then(response => {
        console.log(name);
        console.log(response);
        const then = response.data.attributes.points[0].value;
        const now = response.data.attributes.points[1].value;
        return {
          name,
          gpa: {
            then: (then === null) ? then : then.toFixed(3),
            now: (now === null) ? now : now.toFixed(3)
          }
        }
      });
  });
  return await Promise.all(requests);
};

module.exports = async () => {
  const { data: orgs } = await getOrgs();
  const { id } = orgs.find(({ attributes: { name } }) => name === 'BVAccel');
  const { data: repos } = await getRepos(id);
  const gpas = await getGpas(repos);
  console.log(gpas);


  // const data = await Promise.all(apiRequests);
  // console.log(data);
};



// const sendEmail = emailString => {
//   const mailOptions = {
//     from: '"The Dean\'s Office" <tyler@bvaccel.com>', // sender address
//     to: 'delivery@bvaccel.com',
//     cc: 'tyler@bvaccel.com, annie@bvaccel.com',
//     subject: `🎒 BVA Weekly Report Card™ for ${dates.pretty}`,
//     html: emailString
//   };

//   transporter.sendMail(mailOptions, (error, info) => {
//     if (error) {
//       return console.log(error);
//     }
//     console.log('Message %s sent: %s', info.messageId, info.response);
//   });
// };

// const doSomethign = function () {
//   if (moment().day() === 2) {
//     console.log('it\'s Tuesday!');
//     getData()
//       .then(filterNulls)
//       .then(filterBigMovers)
//       .then(createChangeTable)
//       .then(createEmailString)
//       .then(sendEmail);
//   } else {
//     console.log('it\'s not Tuesday.');
//   };
//   return;
// };

// doSomethign();
