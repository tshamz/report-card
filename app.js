const moment = require('moment');
const getGrades = require('./report-card');

const init = function () {
  if (moment().day() === 4) {
    getGrades()
    console.log('it\'s Thursday!');
  } else {
    console.log('it\'s not Thursday.');
  };
  return;
}();
