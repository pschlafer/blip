/* dump electras data into db */
var data = require('./electra.json');
var mongojs = require('mongojs');
var config = require('./package.json').config.dev;
var db = mongojs(config['mongodb-connection-string'], ['deviceData', 'device', 'groups']);
var common = require('common');

var groupId = "359767674103279";
var deviceId;

common.step([
	function(next) {
		console.log('removing');
		db.device.remove(next);
	},
	function(d, next) {
		console.log('removed');
		db.device.save({
			groupId: groupId
		}, next);
	},
	function(d, next) {
		console.log('find group');
		deviceId = d._id;
		console.log({id: groupId});

		db.groups.findOne({id: groupId}, next);
	},
	function(d, next) {
		console.log('found group', d);
		d.devices = [{
			id: deviceId
		}];

		db.groups.save(d, next);
	},
	function(d, next) {
		db.deviceData.remove(next);
	},
	function(d, next) {
		var entries = data.data.map(function(d) {
			d.groupId = groupId;
			d.deviceId = deviceId;
			return d;
		});

		db.deviceData.insert(entries, next);
	},
	function(next) {
		console.log('done');
	}
	],
	function(error) {
		console.log('error', error);
	}
);
/*
db.device.remove(function(err) {
	if (err) {
		
		return;
	}


	db.deviceData.remove(function(err) {
		if (err) {
			console.log('error', err);
			return;
		}
		db.deviceData.insert(data.data, function(err) {
			if (err) {
				console.log('error', err);
				return;
			}
			console.log('done');
		});
	});

});
*/