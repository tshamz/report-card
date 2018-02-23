const moment = require('moment');
const getGrades = require('./app');

const init = function () {
  if (moment().day() === 2) {
    console.log('it\'s Tuesday!');
    getGrades()
  } else {
    console.log('it\'s not Tuesday.');
  };
  return;
}();
