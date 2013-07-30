/* dump electras data into db */
var data = require('./electra.json');
var mongojs = require('mongojs');
var db = mongojs('mongodb://root:root@dharma.mongohq.com:10022/blip', ['deviceData']);

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