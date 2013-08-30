var es = require('event-stream'),
  moment = require('moment');

var cgmColumns = {
  'Time': 0,
  'mg/dl': 1
};

var pstTime = function(time) { var date = new Date(time);var utc = toUTC(date);utc.setHours(date.getHours() - 7);return utc; };
var toUTC = function(date) { return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds()); }

var pumpColumns = {
  'Time': 0,
  'Basal Amount (U/h)': 1,
  'Bolus Type': 2,
  'Bolus Volume (U)': 3,
  'Immediate Volume (U)': 4,
  'Extended Volume (U)': 5,
  'Duration (min)': 6,
  'Carbs(g)': 7,
  'Notes': 8
};

module.exports = function(groupId) { return  {
  all: function(raw, callback) {
    console.log(raw);
    var values = raw.split(',');

    if (values[pumpColumns['Bolus Volume (U)']]) {
      var time = moment(values[pumpColumns['Time']]).toISOString();

      if(time.indexOf('NaN') != -1) {
        return callback();
      }
      var data = {
        bolus: values[pumpColumns['Bolus Volume (U)']],
        value: values[pumpColumns['Bolus Volume (U)']],
        bolus_duration: values[pumpColumns['Duration (min)']],
        bolus_type: values[pumpColumns['Bolus Type']],
        type: 'bolus',
        time: time,
        groupId: groupId,
        unixTimeUTC: toUTC(new Date(time)).getTime(),
        unixTime: pstTime(time).getTime(),
        company: "animas"
      };
      return callback(null, data);
    }

    if (values[pumpColumns['Basal Amount (U/h)']]) {
      var time = moment(values[pumpColumns['Time']]).toISOString();

      if(time.indexOf('NaN') != -1) {
        return callback();
      }

      var data = {
        basal: values[pumpColumns['Basal Amount (U/h)']],
        value: values[pumpColumns['Basal Amount (U/h)']],
        type: 'basal',
        time: time,
        groupId: groupId,
        unixTimeUTC: toUTC(new Date(time)).getTime(),
        unixTime: pstTime(time).getTime(),
        company: "animas"
      };

      return callback(null, data);
    }

    if (values[pumpColumns['Carbs(g)']]) {
      var time = moment(values[pumpColumns['Time']]).toISOString();

      if(time.indexOf('NaN') != -1) {
        return callback();
      }

      var data = {
        carbs: values[pumpColumns['Carbs(g)']],
        value: values[pumpColumns['Carbs(g)']],
        type: 'carbs',
        units: 'grams',
        time: time,
        groupId: groupId,
        unixTimeUTC: toUTC(new Date(time)).getTime(),
        unixTime: pstTime(time).getTime(),
        company: "animas"
      };

      return callback(null, data);
    }

    return callback();
  },
  sugar : function(raw, callback) {
    var values = raw.split(',');

    if (!values[cgmColumns['mg/dl']]) {
      return callback();
    }

    var time = moment(values[cgmColumns['Time']]).toISOString();

    if(time.indexOf('NaN') != -1) {
        return callback();
      }
      
    var data = {
      value: values[cgmColumns['mg/dl']],
      type: Math.random() > 0.9 ? 'smbg' : 'cbg',
      time: time,
      groupId: groupId,
      unixTimeUTC: toUTC(new Date(time)).getTime(),
      unixTime: pstTime(time).getTime(),
      company: "dexcom",
    };

    return callback(null, data);
  }
}};