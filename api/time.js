var pstTime = function(time) {
	var date = new Date(time);
	var utc = toUTC(date);
	
	utc.setHours(date.getHours() - 7);

	return utc;
};

var toUTC = function(date) { return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds()); }

module.exports = {
	toUTC: toUTC,
	pstTime: pstTime
};