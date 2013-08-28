var stats = function(bg, cgm, bolusData, basalData) {

	var today = startOfDay(new Date()).getTime();
	var bgTicks = _.pluck(bg, 'ticks');
	var cgmTicks = _.pluck(cgm, 'ticks');
	
	//bolusData = _.filter(insulin, function(e){ return !!e.bolus; });
	bolusData = _.uniq(bolusData, true, function(e) {
		return e.ticks;
	});
	bolusTicks = _.pluck(bolusData, 'ticks');

	//var basalData = _.filter(insulin, function(e){ return !!e.basal; });
	basalData = _.uniq(basalData, true, function(e) {
		return e.ticks;
	});
	var basalTicks = _.pluck(basalData, 'ticks');

	var average = function(start, end) {
		var bounds = {start:null, end:null};

		for(var i in bgTicks) {
			if ((bgTicks[i] > start || bgTicks[i] == start) && !bounds.start) {
				bounds.start = parseInt(i);
			}
			if ((bgTicks[i] > end || bgTicks[i] == end) && !bounds.end) {
				bounds.end = parseInt(i);
				break
			}
		}

		if(!_.isNumber(bounds.start) && !_.isNumber(bounds.end)) {
			return;
		}

		if (!_.isNumber(bounds.start)) {
			bounds.start = 0;
		}

		if (!_.isNumber(bounds.end)) {
			bounds.end = bgTicks.length - 1;
		}

		var sum = 0;
		var count = 0;

		
		for(var i = bounds.start; i < bounds.end; i++) {
			sum += parseInt(bg[i].value);
			count++;
		}

		if (sum === 0) {
			return '';
		}
		return Math.round(sum/count);
	};

	var basal = function(start, end) {
		var bounds = {start:null, end:null};

		for(var i in basalTicks) {
			if ((basalTicks[i] > start || basalTicks[i] == start) && !bounds.start) {
				bounds.start = parseInt(i);
			}
			if ((basalTicks[i] > end || basalTicks[i] == end) && !bounds.end) {
				bounds.end = parseInt(i);
				break
			}
		}

		if (!_.isNumber(bounds.start) || !_.isNumber(bounds.end)) {
			return 0;
		}

		var sum = 0;

		var milliHour = 3600000;

		for(var i = bounds.start - 1; i < bounds.end; i++) {
			if(!basalData[i]) {
				continue;
			}
			
			var milliBasal = parseFloat(basalData[i].value)/milliHour;

			var begin = start;

			if(i > bounds.start - 1) {
				begin = basalData[i].ticks;
			}

			var next = end;
			if(i < bounds.end - 1) {
				next = basalData[i+1].ticks;
			}
			
			sum += milliBasal * Math.abs(next - begin);
		}

		return sum;
	};

	var insulinRatio = function(start, end) {
		var ba = basal(start, end);
		var bo = bolus(start, end);
		var total = ba + bo;
		var days = Math.abs(end-start)/oneDay;

		if(!ba && !bo) {
			return;
		}

		return {
			total: parseInt(total),
			basal: parseInt(ba),
			bolus: parseInt(bo),
			periodAverages: {
				total: parseInt(total/days),
				basal: parseInt(ba/days),
				bolus: parseInt(bo/days),
			},
			basalPercent: parseInt((ba * 100)/total),
			bolusPercent: 100 - parseInt((ba * 100)/total),
			days: days
		}
	};

	var bolus = function(start, end) {

		var bounds = {start:null, end:null};

		for(var i in bolusTicks) {
			if ((bolusTicks[i] > start || bolusTicks[i] == start) && !bounds.start) {
				bounds.start = parseInt(i);
			}
			if ((bolusTicks[i] > end || bolusTicks[i] == end) && !bounds.end) {
				bounds.end = parseInt(i);
				break
			}
		}

		if (!_.isNumber(bounds.start)) {
			return 0;
		}

		if (!_.isNumber(bounds.end)) {
			bounds.end = bolusTicks.length - 1;
		}

		var sum = 0;

		for(var i = bounds.start; i < bounds.end; i++) {
			sum += parseFloat(bolusData[i].bolus);
		}

		return sum;
	};

	var range = function(start, end) {
		var bounds = {start:null, end:null};

		for(var i in cgmTicks) {
			if ((cgmTicks[i] > start || cgmTicks[i] == start) && !bounds.start) {
				bounds.start = parseInt(i);
			}
			if ((cgmTicks[i] > end || cgmTicks[i] == end) && !bounds.end) {
				bounds.end = parseInt(i);
				break
			}
		}

		if (!_.isNumber(bounds.start) || !_.isNumber(bounds.end)) {
			return;
		}

		var good = 0;
		var count = 0;


		for(var i = bounds.start; i < bounds.end; i++) {
			if( parseInt(cgm[i].value) > 80 && parseInt(cgm[i].value) < 180) {
				good++;
			}
			count++;
		}

		var percent = Math.round(good/count * 100);

		if(!_.isNumber(percent) || isNaN(percent)) {
			return '';
		}
		return percent;
	};

	return {
		average : average,
		range: range,
		bolus: bolus,
		basal: basal,
		insulinRatio: insulinRatio 
	}
};

