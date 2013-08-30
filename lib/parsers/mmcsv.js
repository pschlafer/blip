var es = require('event-stream')
  , moment = require('moment')
  , timeParser = require('./timeParser');

var columns = {
  'Index': 0, 
  'Date': 1, 
  'Time': 2,
  'Timestamp': 3,
  'New Device Time': 4,
  'BG Reading (mg/dL)': 5,
  'Linked BG Meter ID': 6,
  'Temp Basal Amount (U/h)': 7,
  'Temp Basal Type': 8,
  'Temp Basal Duration (hh:mm:ss)': 9,
  'Bolus Type': 10,
  'Bolus Volume Selected (U)': 11,
  'Bolus Volume Delivered (U)': 12, 
  'Programmed Bolus Duration (hh:mm:ss)': 13,
  'Prime Type': 14,
  'Prime Volume Delivered (U)': 15,
  'Suspend': 16, 
  'Rewind': 17,
  'BWZ Estimate (U)': 18, 
  'BWZ Target High BG (mg/dL)': 19,
  'BWZ Target Low BG (mg/dL)': 20, 
  'BWZ Carb Ratio (grams)': 21,
  'BWZ Insulin Sensitivity (mg/dL)': 22,
  'BWZ Carb Input (grams)': 23,
  'BWZ BG Input (mg/dL)': 24,
  'BWZ Correction Estimate (U)': 25,
  'BWZ Food Estimate (U)': 26,
  'BWZ Active Insulin (U)': 27,
  'Alarm': 28,
  'Sensor Calibration BG (mg/dL)': 29,
  'Sensor Glucose (mg/dL)': 30,
  'ISIG Value': 31,
  'Daily Insulin Total (U)': 32,
  'Raw-Type': 33,
  'Raw-Values': 34, 
  'Raw-ID': 35,
  'Raw-Upload ID': 36,
  'Raw-Seq Num': 37, 
  'Raw-Device Type': 38,
};

var parsers = {
  smbg : function(raw, callback) {
    var values = mmcsv.splitIntoFeilds(raw);
    
    if (!values[columns['BG Reading (mg/dL)']]) {
      return callback();
    }

    if(!timeParser.valid(values[columns['Timestamp']])) {
      return callback();
    }

    var data = {
      value: values[columns['BG Reading (mg/dL)']],
      type: 'smbg',
      time: moment(values[columns['Timestamp']]).toISOString(),
      created_time: timeParser.getCreatedTime(values[columns['Timestamp']])
    };
    
    return callback(null, JSON.stringify(data));
  },
  cbg : function(raw, callback) {
    var values = mmcsv.splitIntoFeilds(raw);

    if (!values[columns['Sensor Glucose (mg/dL)']]) {
      return callback();
    }

    if(!timeParser.valid(values[columns['Timestamp']])) {
      return callback();
    }

    var data = {
      value: values[columns['Sensor Glucose (mg/dL)']],
      type: 'cbg',
      time: moment(values[columns['Timestamp']]).toISOString(),
      created_time: timeParser.getCreatedTime(values[columns['Timestamp']])
    };

    return callback(null, JSON.stringify(data));
  },
  bolus: function(raw, callback) {
    var values = mmcsv.splitIntoFeilds(raw);
    
    if(!values[columns['Timestamp']]) {
      return callback();
    }

    if(!timeParser.valid(values[columns['Timestamp']])) {
      return callback();
    }

    var data = {
      value: values[columns['Bolus Volume Selected (U)']],
      bolus: values[columns['Bolus Volume Selected (U)']],
      bolus_delivered: values[columns['Bolus Volume Delivered (U)']],
      bolus_type: values[columns['Bolus Type']],
      type: 'bolus',
      time: moment(values[columns['Timestamp']]).toISOString(),
      created_time: timeParser.getCreatedTime(values[columns['Timestamp']])
    };

    return callback(null, JSON.stringify(data));
  },
  basal: function(raw, callback) {
    var values = mmcsv.splitIntoFeilds(raw);

    if(!timeParser.valid(values[columns['Timestamp']])) {
      return callback();
    }

    if (values[columns['Raw-Values']]) {
      var rawValue = values[columns['Raw-Values']].split(',');

      var data = {
        basal: rawValue[2].split('=')[1],
        basal_type: rawValue[0].split('=')[1],
        value: rawValue[2].split('=')[1],
        type: 'basal',
        start: rawValue[3].split('=')[1],
        time: moment(values[columns['Timestamp']]).toISOString(),
        created_time: timeParser.getCreatedTime(values[columns['Timestamp']])
      };

      return callback(null, JSON.stringify(data));
    }

    return callback();
  },
  carbs: function(raw, callback) {
    var values = mmcsv.splitIntoFeilds(raw);

    if(!values[columns['Raw-Values']]) {
      return callback();
    }

    if(!timeParser.valid(values[columns['Timestamp']])) {
      return callback();
    }
    
    var rawCarbDetail = values[columns['Raw-Values']].split(',');
    var data = {
      carbs: rawCarbDetail[2].split('=')[1],
      value: rawCarbDetail[2].split('=')[1],
      type: 'carbs',
      units: rawCarbDetail[3].split('=')[1],
      time: moment(values[columns['Timestamp']]).toISOString(),
      created_time: timeParser.getCreatedTime(values[columns['Timestamp']])
    };

    return callback(null, JSON.stringify(data));
  }
};

var mmcsv = function() {
  var meta = {};

  var responder = function(filter) {
    var tr = es.through();

    stream.on('type', function(data) {
      if (data.type.match(filter)) {
        return tr.push(data.data);
      }
    });
    return es.pipeline(stream, tr);
  };

  var patterns = {
    smbg: /BGReceived/g,
    cbg: /GlucoseSensorData|BGLifeScan|BGTherasense/g,
    bolus: /BolusNormal|BolusSquare/g,
    basal: /CurrentBasalProfile\b|BasalProfileStart/g,
    carbs: /BolusWizardBolusEstimate/g,
    all: /BGReceived|GlucoseSensorData|BGLifeScan|BGTherasense|BolusNormal|BolusSquare|CurrentBasalProfile\b|BasalProfileStart|BolusWizardBolusEstimate/g //todo make this smarter
  };

  var stream = es.pipeline(es.split(), es.map(function(data, callback) {
    var fields = data.split(',');

    if (fields.length < 36) {
      return callback(null, data);
    } else {
      stream.emit('type', {type: fields[33], data: data});
      return callback();
    }
  }));

  stream.smbg = function() {
    return es.pipeline(responder(patterns.smbg), es.map(parsers.smbg));
  };

  stream.cbg = function() {
    return es.pipeline(responder(patterns.cbg), es.map(parsers.cbg));
  };

  stream.bolus = function() {
    return es.pipeline(responder(patterns.bolus), es.map(parsers.bolus));
  };

  stream.basal = function() {
    return es.pipeline(responder(patterns.basal), es.map(parsers.basal));
  };
  
  stream.carbs = function() {
    return es.pipeline(responder(patterns.carbs), es.map(parsers.carbs));
  };

  stream.all = function() {
    return es.pipeline(responder(patterns.all), es.map(function(raw, callback) {
      if (raw.match(patterns.smbg)) {
        parsers.smbg(raw, callback);
      }
      else if (raw.match(patterns.cbg)) {
        parsers.cbg(raw, callback);
      }
      else if (raw.match(patterns.bolus)) {
        parsers.bolus(raw, callback);
      }
      else if (raw.match(patterns.basal)) {
        parsers.basal(raw, callback);
      }
      else if (raw.match(patterns.carbs)) {
        parsers.carbs(raw, callback); 
      }
      else callback();
    }));
  };

  stream.responder = responder;

  return stream;
};

/*
stream.basaltemp = function() {
    return es.pipeline(responder(/CurrentTempBasal\b/g), es.map(function(rawData, callback) {
      var entryValues, processedTempBasal, rawBasalValue;
      entryValues = mmcsv.splitIntoFeilds(rawData);
      rawBasalValue = entryValues[columns['Raw-Values']].split(',');
      processedTempBasal = {
        basal_temp: rawBasalValue[0].split('=')[1],
        duration: rawBasalValue[1].split('=')[1],
        type: 'todo',
        time: moment(entryValues[columns['Timestamp']]).toISOString()
      };
      return callback(null, JSON.stringify(processedTempBasal));
    }));
  };
*/
mmcsv.redo_comma = function(fields) {
  var cols, data, insane_comma, line;
  cols = fields.slice(0, 33);
  data = fields.slice(33);
  insane_comma = /"(.*)"|,/g;
  line = data.join(',');
  return '';
};

mmcsv.splitIntoFeilds = function(rawData) {
  var firstDoubleQuote, firstPart, lastDoubleQuote, processFields, secondPart, thirdPart;
  firstDoubleQuote = rawData.indexOf("\"");
  lastDoubleQuote = rawData.lastIndexOf("\"");
  firstPart = rawData.slice(0, firstDoubleQuote - 1);
  secondPart = rawData.slice(firstDoubleQuote + 1, lastDoubleQuote);
  thirdPart = rawData.slice(lastDoubleQuote + 2, rawData.length);
  processFields = firstPart.split(',');
  processFields.push(secondPart);
  processFields = processFields.concat(thirdPart.split(','));
  return processFields;
};

mmcsv.isCgm = function(entryValues) {
  var isCgm;
  isCgm = entryValues[columns['Sensor Glucose (mg/dL)']] || entryValues[columns['Raw-Type']] === 'BGTherasense' ? true : false;
  return isCgm;
};

mmcsv.bolus = function() {
  return mmcsv().bolus();
};

mmcsv.basal = function() {
  return mmcsv().basal();
};

mmcsv.smbg = function() {
  return mmcsv().smbg();
};

mmcsv.cbg = function() {
  return mmcsv().cbg();
};

mmcsv.carbs = function() {
  return mmcsv().carbs();
};

mmcsv.all = function() {
  return mmcsv().all();
};

mmcsv.columns = function() {
  return columns;
};

module.exports = mmcsv;