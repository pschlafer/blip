var package = require('./../package.json');
var config = process.env.NODE_ENV === 'production' ? package.config.prod : package.config.dev;

var mongojs = require('mongojs')	
	, fs = require('fs')
	, es = require('event-stream')
	, db = mongojs(config.mongodb_connection_string, ['deviceData'])
	, mmcsv = require('./parsers/mmcsv');


// todo: add time zone origin parameter, it now assumes that user is in SF summer time
var pstTime = function(time) { var date = new Date(time);var utc = toUTC(date);utc.setHours(date.getHours() - 7);return utc; };
var toUTC = function(date) { return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds()); }

var medtronic = function(groupId, filePath, callback) {
	db.deviceData.remove({groupId: groupId}, function() {
		es.pipeline(fs.createReadStream(filePath), mmcsv.all().on('data',
			function(raw) {
				var entry = JSON.parse(raw);

				entry.groupId = groupId;
				entry.unixTimeUTC = toUTC(new Date(entry.time)).getTime();
				entry.unixTime = pstTime(entry.time).getTime();
				entry.company = 'medtronic';

				console.log(entry);
		    db.deviceData.save(entry, function(){});
		  }).on('end', function() {
		  	console.log('done parsing medtronic');
		  	callback(null, { done: true });
		  })
		);
	});
};

var upload = {
	medtronic: medtronic
};