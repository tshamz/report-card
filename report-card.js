const url = require('url');
const moment = require('moment');
const fetch = require('node-fetch');

const email = require('./email.js');
const { transporter, tunings, requestHeaders: headers } = require('./config');

const dates = {
  now: moment().format('YYYY-MM-DD'),
  then: moment().subtract(tunings.amount, tunings.unit),
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

const getSnapshot = (name, id) => {
  const url = `${API_BASE}/repos/${id}/snapshots/${id}`;
  return fetch(url, { headers })
    .then(response => response.json())
    .then(response => ({...response.data, name}))
    .catch(error => console.error(error));
};

const getPastBuilds = (name, id) => {
  const url = `${API_BASE}/repos/${id}/builds`;
  return fetch(url, { headers })
    .then(response => response.json())
    .then(({data: builds}) => ({builds, name}))
    .catch(error => console.error(error));
};

const getMetrics = async repos => {
  const initialData = repos.reduce(({builds, snapshots}, {id, relationships, attributes: {human_name: name}}) => {
    if (!relationships.latest_default_branch_snapshot.data) return {builds, snapshots};
    const now = relationships.latest_default_branch_snapshot.data.id;
    return {builds: [...builds, getPastBuilds(name, id)], snapshots: [...snapshots, getSnapshot(name, now)]}
  }, {builds: [], snapshots: []});

  const buildPromises = new Promise(async resolve => {
    resolve(await Promise.all(initialData.builds));
  });

  const snapshotPromises = new Promise(async resolve => {
    resolve(await Promise.all(initialData.snapshots));
  });

  return await Promise.all([buildPromises, snapshotPromises])
  .then(items => {
    const [builds, snapshots] = items;
    return builds.reduce(({promises, repos}, {name, builds}, i) =>{
      const oldBuild = builds.find(build => dates.then.isSameOrAfter(build.attributes.finished_at));
      const hasSnapshot = oldBuild.relationships.snapshot.data;
      const isNewSnapshot = (hasSnapshot) ? oldBuild.relationships.snapshot.data.id !== snapshots[i].id : false;
      if (!oldBuild || !hasSnapshot || !isNewSnapshot) {
        return {promises, repos: [...repos, {name, now: snapshots[i]}]}
      } else {
        const then = oldBuild.relationships.snapshot.data.id;
        return {promises: [...promises, getSnapshot(name, then)], repos: [...repos, {name, now: snapshots[i]}]}
      }
    }, {promises: [], repos: []});
  })
  .then(async data => {
    await Promise.all(data.promises).then(items => {
      items.forEach(item => {
        const repo = data.repos.find(repo => repo.name === item.name);
        repo.then = item;
      })
    });
    return data.repos;
  });
};

const sortScores = scores => {
  const newScores = scores.map(({name, now, then}) => {
    const nowScores = {
      maintainabilityGrade: now.attributes.ratings.find(rating => rating.pillar === "Maintainability").letter || "N/A",
      technicalDebtRatio: now.meta.measures.technical_debt_ratio.value.toFixed(3),
      issuesCount: now.meta.issues_count
    };
    const thenScores = (then) ? {
      maintainabilityGrade: then.attributes.ratings.find(rating => rating.pillar === "Maintainability").letter || "N/A",
      technicalDebtRatio: then.meta.measures.technical_debt_ratio.value.toFixed(3),
      issuesCount: then.meta.issues_count
    } : {};
    const change = (then) ? {
      technicalDebtRatio: (now.meta.measures.technical_debt_ratio.value - then.meta.measures.technical_debt_ratio.value).toFixed(3),
      issuesCount: now.meta.issues_count - then.meta.issues_count
    } : {};
    return {name, now: nowScores, then: thenScores, change};
  });

  const moversSort = newScores.sort((a, b) => {
    const aTechDebt = Math.abs(a.change.technicalDebtRatio) || 0;
    const bTechDebt = Math.abs(b.change.technicalDebtRatio) || 0;
    return bTechDebt - aTechDebt;
  });

  const moversAndShakers = moversSort.splice(0, 3);

  const ratingsSort = moversSort.sort((a, b) => {
    const aTechDebt = a.now.technicalDebtRatio;
    const bTechDebt = b.now.technicalDebtRatio;
    const aIssues = a.now.issuesCount;
    const bIssues = b.now.issuesCount;
    return (aTechDebt === bTechDebt) ? aIssues - bIssues : aTechDebt - bTechDebt;
  });

  const top = ratingsSort.splice(0, 3);
  const bottom = ratingsSort.reverse().splice(0, 3);
  const random = Array(3).fill().map((_, i) => {
    const randomInt = Math.floor(Math.random() * (ratingsSort.length - 0) + 0);
    return ratingsSort.splice(randomInt, 1);
  }).reduce((accumulator, score) => [...accumulator, ...score], []);

  return {top, bottom, random, moversAndShakers};
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
  // sendEmail(emailString);
};
