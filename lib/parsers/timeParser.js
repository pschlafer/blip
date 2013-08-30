var moment = require('moment');

var valid = function(rawTime) {
  if(moment(rawTime).toISOString().indexOf('NaN') == -1) {
    return true;
  }
  return false;
};

var getCreatedTime = function(rawTime) {
  var time = moment(rawTime);

  return {
    raw: rawTime,
    unix: time.format('X'),
    unixMili: time.format('X') * 1000,
    daytime: time.format('h:mm a ddd Do'),
    time: time.format('h:mm a'),
    dayMilliseconds: (time.format('X')*1000) - (time.startOf('day').format('X')*1000),
    daysSinceEpox: (time.startOf('day').format('X')*1000 - moment(0).startOf('day').format('X')*1000) / (1000*60*60*24)
  }
};

module.exports = {
	getCreatedTime: getCreatedTime,
  valid: valid
};