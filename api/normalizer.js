var _ = require('underscore');

var pumpAdherence = require("./electra-json-data/pump-adherence.json");
var pumpSettings = require("./electra-json-data/pump-settings.json");
var pumpEvents = require("./electra-json-data/pump-events.json");
var cgm = require("./electra-json-data/cgm.json");
var bg = require("./electra-json-data/bg.json");
var pumpInsulin = require("./electra-json-data/pump-insulin.json");

var pstTime = function(time) {
	var date = new Date(time);
	var utc = toUTC(date);
	
	utc.setHours(date.getHours() - 7);

	return utc;
};

var toUTC = function(date) { return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds()); }

var replaceAt = function(string, index, character) {
	return string.substr(0, index) + character + string.substr(index+character.length);
}

var jsifyNames = function(name) {
	var regex = /-/g;
	var result = [];

	while ( (result = regex.exec(name)) ) {
		name = replaceAt(name, result.index+1, name.charAt(result.index+1).toUpperCase());
	}
	
	name = name.replace(regex, '');
		  	
	return name;
};

module.exports = function() {
	var insulin = pumpInsulin.map(function(entry) {

		entry.unixTimeUTC = toUTC(new Date(entry.time)).getTime();
		entry.unixTime = pstTime(entry.time).getTime();
		delete entry['time'];

		if(entry.dur) {
			entry.duration = entry.dur;
			delete entry.dur;
		}

		if (entry['bolus_type']) {
			entry.bolusType = entry['bolus_type'];
			delete entry['bolus_type'];
		}

		if (entry.bolus) {
			entry.type = 'bolus';
		}

		if (entry.basal) {
			entry.type = 'basal';
		}

		if (entry.carbs) {
			entry.type = 'carbs';
		}

		return entry;
	});

	var adherence = pumpAdherence.map(function(entry) {

		entry.unixTimeUTC = toUTC(new Date(entry.time)).getTime();
		entry.unixTime = pstTime(entry.time).getTime();
		delete entry['time'];

		if(entry.dur) {
			entry.duration = entry.dur;
			delete entry.dur;
		}

		delete entry['time'];

		entry.bg = {
			time: entry['post-time'],
			bg: entry['post-bg']
		}
		delete entry['post-bg'];
		delete entry['post-time'];

		entry.bolusType = entry.type;
		entry.type = 'bolus-calculator';

		return entry;
	});

	var smbg = bg.map(function(entry) {
		entry.unixTimeUTC = toUTC(new Date(entry.time)).getTime();
		entry.unixTime = pstTime(entry.time).getTime();
		delete entry['time'];

		entry.type = 'bg';

		return entry;
	});

	var _cgm = cgm.map(function(entry) {
		entry.unixTimeUTC = toUTC(new Date(entry.time)).getTime();
		entry.unixTime = pstTime(entry.time).getTime();
		delete entry['time'];

		entry.type = 'cbg';

		return entry;
	});

	var events = pumpEvents.map(function(entry) {
		entry.unixTimeUTC = toUTC(new Date(entry.time)).getTime();
		entry.unixTime = pstTime(entry.time).getTime();
		delete entry['time'];

		entry.type = 'event';

		return entry;
	});		

	var settings = pumpSettings.map(function(entry) {
		entry.unixTimeUTC = toUTC(new Date(entry.time)).getTime();
		entry.unixTime = pstTime(entry.time).getTime();
		delete entry['time'];

		entry.type = 'settings';

		var dash = ['basal-programs', 'bg-targets-program', 'ic-program', 'isf-program'];

		for(var i in dash) {
			entry[jsifyNames(dash[i])] = entry[dash[i]];
			delete entry[dash[i]];
		}

		for(var i in entry['base']) {
			entry[jsifyNames(i)] = entry['base'][i];
			delete entry['base'][i];
		}

		return entry;
	});

	var data = [].concat(pumpAdherence,pumpInsulin,pumpEvents,pumpSettings,bg,cgm);
	
	data = _.sortBy(data, function(d) {
		return d.unixTime;
	});

	//console.log(JSON.stringify(_.uniq(data, function(d){ return _.keys(d).toString()}),null,'\t'));
	return data;
};