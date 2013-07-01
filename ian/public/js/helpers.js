var deltaDays = function(start, end) {
	return Math.ceil((end.getTime() - start.getTime()) / (1000*60*60*24));
};

var parseTime = function(time) {
	var d = convertDateToUTC(new Date(time));

	d.setHours(d.getHours() - 7);

	return d;
};

var addDate = function(reading) {
	reading.date = parseTime(reading.time);
	reading.ticks = reading.date.getTime();

	return reading;
};

var convertDateToUTC = function(date) { return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds()); }

var dayId = function(time) {
	return time.getDate() + '-' + time.getMonth() + '-' + time.getYear();
};

var dayMinutes = function(time) {
	return time.getHours() * 60 + time.getMinutes();
};

var dayMilliseconds = function(time) {
	return time.getHours() * 3600000 + time.getMinutes() * 60000 + time.getSeconds() * 1000;
};

var getDays = function(bg) {
	var days = _.groupBy(bg, function(reading){ 

		return dayId(parseTime(reading.time));
	});

	return days;
};


var shape = function(reading, x, y, svgContainer) {
	var blue = '#41A5C5';
	
	reading.value = reading.bg || reading.cbg;

	if(reading.value == 'Low') {
		reading.value = 0;
	}
	if(reading.value == 'High') {
		reading.value = 1000;
	}

	var ranges = [
		{
			low: 0,
			high: 60,
			color: '#FF0000',
			shape: 'down'
		},
		{
			low: 60,
			high: 80,
			color: '#FF0000',
			shape: 'downring'
		},
		{
			low: 80,
			high: 140,
			color: '#41A5C5',
			shape: 'ring'
		},
		{
			low: 140,
			high: 180,
			color: '#41A5C5',
			shape: 'circle',
		},
		{
			low: 180,
			high: 250,
			color: '#FFCE00',
			shape: 'upring',
		},
		{
			low: 250,
			high: 1000,
			color: '#FFCE00',
			shape: 'up',
		}
	];

	var color;
	var shape;

	for(var i in ranges) {
		var range = ranges[i];

		if(reading.value >= range.low && reading.value <= range.high) {
			color = range.color;
			shape = range.shape;
		}
	}

	var time = parseTime(reading.time);
	var id = dayId(time) + '-' + dayMinutes(time);
	var point;

	if(reading.bg) switch(shape) {
		case 'ring':
		point = svgContainer.append("circle")
			.attr("cx", x)
			.attr("cy", y)
			.attr("r", 5.5)
			.attr('id', id)
			.attr('stroke', color)
			.attr('stroke-width', '2')
			.attr('fill-opacity', 0)
      .attr('fill', 'white');
		break;
		case 'up':
		var p = (6+x) + ',' + (0+y-5.5)  + ' ' + (11+x) + ',' + (11+y-5.5) + ' ' + (0+x) + ',' + (11+y-5.5) + ' ';
		
    point = svgContainer.append("polygon")
			.attr('points', p)
			.attr('id', id)
			.attr('stroke', color)
			.attr('stroke-width', '2')
      .attr('fill', color);
		break;
		case 'upring':
		var p = (6+x) + ',' + (0+y-5.5)  + ' ' + (11+x) + ',' + (11+y-5.5) + ' ' + (0+x) + ',' + (11+y-5.5) + ' ';
		
    point = svgContainer.append("polygon")
			.attr('points', p)
			.attr('id', id)
			.attr('stroke', color)
			.attr('stroke-width', '2')
			.attr('fill-opacity', 0)
      .attr('fill', 'white');
		break;
		case 'down':
		var p = (x) + ',' + (y-5.5) + ' ' + (11+x) + ',' + (0+y-5.5) + ' ' + (6+x) + ',' + (11+y-5.5);
		
    point = svgContainer.append("polygon")
			.attr('points', p)
			.attr('stroke', color)
			.attr('id', id)
			.attr('stroke-width', '2')
      .attr('fill', color);
		break;
		case 'downring':
		var p = (x) + ',' + (y-5.5) + ' ' + (11+x) + ',' + (0+y-5.5) + ' ' + (6+x) + ',' + (11+y-5.5);
		
		
    point = svgContainer.append("polygon")
			.attr('points', p)
			.attr('id', id)
			.attr('stroke', color)
			.attr('stroke-width', '2')
      .attr('fill', 'white')
      .attr('fill-opacity', 0);
		break;
		case 'circle':
		point = svgContainer.append("circle")
			.attr("cx", x)
			.attr("cy", y)
			.attr("r", 5)
			.attr('id', id)
			.attr('stroke', color)
			.attr('stroke-width', '2')
      .attr('fill', color);
		break;
		default:
		point = svgContainer.append("circle")
			.attr("cx", x)
			.attr("cy", y)
			.attr("r", 5)
			.attr('id', id)
			.attr('stroke', color)
			.attr('stroke-width', '2')
      .attr('fill', 'white');
		break;
	}

	if(reading.cbg) {
		point = svgContainer.append("circle")
			.attr("cx", x)
			.attr("cy", y)
			.attr("r", 2)
			.attr('fill-opacity', 1)
      .attr('fill', color);
	}
	point.attr('class','ppoint');
	point.attr('id',reading.ticks);
	
	point.on("mouseover", function() {
		$(this).css('opacity',.2);
	});

  point.on("mouseout", function() {
  	$(this).css('opacity',1);
  });

  $('#' + reading.ticks).tipsy({gravity: 'w', title: function() {
  	return (reading.bg + ' @ ' + moment(parseTime(reading.time)).format("hA ddd Do"));
  }});
 
  point.on('click',function() {  	
  	if(isTimeline) {
  		$('#two').trigger('click');	
  		day.scroll(reading.date);

  	} else {
  		$('#one').trigger('click');
  		timeline.scroll(reading.date);
  	}
  	
  	isTimeline = !isTimeline
  });
};

var drawPath = function(edges, svg, options) {
	if(!options) {
		options = {
			'stroke': 'gray',
			'stroke-width': 1,
			'fill': 'none'
		}
	}

		var lineFunction = d3.svg.line()
		.x(function(d) { return d.x; })
		.y(function(d) { return d.y; })
		.interpolate("step-after");
		
		//The line SVG Path we draw
	var lineGraph = svg.append("path")
		.attr("d", lineFunction(edges));

	for(var o in options) {
		lineGraph.attr(o, options[o]);
	}
};

var startOfDay = function(date) {
	var d = new Date(date.toString());
	d.setHours(0);
	d.setMinutes(0);
	d.setSeconds(0);

	return d;
};

var daypx = 980;
var oneDay = 1000*60*60*24;
var timepx = daypx/oneDay;
var slots = ['12 AM','3 AM','6 AM','9 AM', '12 PM', '3 PM', '6 PM' ,'9 PM'];
var colors = ['#DCE4E8','#E3E9EC','#EAEEF0','#F7F8F9','#F7F8F9','#EAEEF0','#E3E9EC','#DCE4E8'];


var rectangle = function(svg, options) {
	var rectangle = svg.append("rect");

	for(var i in options) {
		rectangle.attr(i, options[i]);
	}
};
