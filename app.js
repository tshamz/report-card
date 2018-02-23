const url = require('url');
const moment = require('moment');
const fetch = require('node-fetch');

const email = require('./email.js');
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

const getMetrics = async repos => {
  const requests = repos.map(({id, relationships, attributes: {human_name: name}}) => {
    const now = relationships.latest_default_branch_snapshot.data.id;
    const url = `${API_BASE}/repos/${id}/snapshots/${now}`;
    return fetch(url, { headers })
      .then(response => response.json())
      .then(response => ({ ...response, name, now }));
  });
  const successes = await Promise.all(requests).then(responses => responses.filter(response => !response.errors));
  return successes.map(({ data, name }) => {
    const maintainabilityGrade = data.attributes.ratings.find(rating => rating.pillar === "Maintainability").letter || "N/A";
    const issues = data.meta.issues_count;
    const result = { maintainabilityGrade, issues, name };
    return result;
  });
};

const sortScores = scores => {
  return scores.sort((a, b) => {
    const gradeA = a.maintainabilityGrade;
    const gradeB = b.maintainabilityGrade;
    if (gradeA === gradeB) {
      const issuesA = a.issues;
      const issuesB = b.issues;
      return (issuesA !== issuesB) ? (issuesA - issuesB) : 0;
    }
    return (gradeA < gradeB) ? -1 : 1;
  })
};

const sendEmail = emailString => {
  const mailOptions = {
    from: '"The Dean\'s Office" <tyler@bvaccel.com>', // sender address
    to: 'delivery@bvaccel.com',
    cc: 'tyler@bvaccel.com, annie@bvaccel.com',
    subject: `🎒 BVA Weekly Report Card™ for ${dates.pretty}`,
    html: emailString
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return console.log(error);
    }
    console.log('Message %s sent: %s', info.messageId, info.response);
  });
};

module.exports = async () => {
  const { data: orgs } = await getOrgs();
  const { id } = orgs.find(({ attributes: { name } }) => name === 'BVAccel');
  const { data: repos } = await getRepos(id);
  const scores = await getMetrics(repos);
  const sortedScores = sortScores(scores);
  const emailString = email(sortedScores);
  sendEmail(emailString);
};
