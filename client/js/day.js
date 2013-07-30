var drawDay = function() {
	var firstDay = startOfDay(bg[0].date);

	var dimensions = {
  	day: 36,
  	width: 1090,
  	yaxis: 45,
  	xaxis: 20,
  	daySpace: 5,
  	dayWidth: 1045,
  	leftEdge: 15,
  	rightEdge: 45,
  	daypx: daypx,
  	segmentWidth: 123
  };

  var scrollTicks = function() {
		var today = startOfDay(new Date());
  	var ticks = today.getTime() - ($('#chartMain').scrollTop()/dimensions.day * oneDay);

  	return ticks;
  }

	var scroll = function(date) {
		var today = startOfDay(new Date());
		var ticks = scrollTicks();
		
		if(!date) {
			date = bg[bg.length-1].date;
		}

		if(date < 0) {
			today.setTime(ticks - (oneDay  * -date));
			date = startOfDay(today);
		}
		
		if(_.isNumber(date)  && date > 0) {
			today.setTime(ticks + (oneDay * date));
			date = startOfDay(today);
		}

		if(date === 'today') {
			date = startOfDay(new Date());
		}


		var top = (startOfDay(new Date()).getTime() - date.getTime()) / oneDay;

		$('#chartMain').animate({ scrollTop: top * dimensions.day + "px" });
	};

	var draw = function(bg) {
    var days = deltaDays(bg[0].date, new Date());
    
    var totalHeight = dimensions.day*days;
    var	svg = d3.select("#chartMain").append("svg").attr("width", dimensions.width).attr("height", totalHeight);
    var svgAxisTop = d3.select("#chartTop").append("svg").attr("width", dimensions.width).attr("height", dimensions.xaxis);
    var svgAxisBottom = d3.select("#chartBottom").append("svg").attr("width", dimensions.width).attr("height", dimensions.xaxis);

    var drawXAxis = function(svg) {
    	var slots = ['12 AM','3 AM','6 AM','9 AM', '12 PM', '3 PM', '6 PM' ,'9 PM','12 AM'];

    	var x = dimensions.yaxis + dimensions.leftEdge;
    	for(var i in slots) {
    		svg.append('text')
					.attr('x', x+5)
					.attr('y', 15)
					.attr('fill', '#2582A8')
					.attr('font-family',"sans-serif")
					.attr('text-anchor',"start")
					.attr('font-size', 11)
					.text(slots[i]);

				svg.append("rect")
	        .attr('x', x)
	        .attr('y', 0)
          .attr("width", 1)
          .attr('fill', '#B7C9D2')
          .attr("height", 18);

        x += dimensions.segmentWidth;  
    	}
    };

    drawXAxis(svgAxisTop);
    drawXAxis(svgAxisBottom);

    var drawYAxis = function(svg) {
			var dayIds = ['su', 'm', 't', 'w', 't', 'f', 's'];
			var today = new Date();

			for(var i = 1; i <= days; i++) {
				if(i>1) {
					today.setDate(today.getDate()-1);	
				}

				var y =  i * dimensions.day - dimensions.day/2 - 4;
				var isWeekend = today.getDay() == 0 || today.getDay() == 6;
				
				svg.append('text')
					.attr('x', 20)
					.attr('y', y + (isWeekend ? 0 : 5))
					.attr('fill', '#AAB9C0')
					.attr('class', 'ptext')
					.attr('font-family',"sans-serif")
					.attr('text-anchor',"start")
					.attr('font-size', 13)
					.text(dayIds[today.getDay()]);	

				if (isWeekend) {
					svg.append('text')
						.attr('x', 20)
						.attr('y', y + 12)
						.attr('fill', '#0081AA')
						.attr('class', 'ptext')
						.attr('font-family',"sans-serif")
						.attr('font-size', 10)
						.text(today.getMonth()+1+'/'+today.getDate());
				}
			}
		};
		drawYAxis(svg);

		var drawBackground = function() {
    	rectangle(svg, {
  			x: dimensions.yaxis + dimensions.segmentWidth * 8,
    		y: 0,
    		fill: colors.background[0],
    		width: 0,
    		height: dimensions.day*days
  		});

    	rectangle(svg, {
  			x: dimensions.yaxis,
    		y: 0,
    		fill: colors.background[0],
    		width: dimensions.leftEdge,
    		height: dimensions.day*days
  		});

    	for(var i in colors.background) {
    		rectangle(svg, {
    			x: dimensions.yaxis + dimensions.leftEdge + dimensions.segmentWidth * i,
	    		y: 0,
	    		fill: colors.background[i],
	    		width: dimensions.segmentWidth,
	    		height: dimensions.day*days
    		});
    	}

    	rectangle(svg, {
  			x: dimensions.yaxis + dimensions.leftEdge + dimensions.segmentWidth * 8,
    		y: 0,
    		fill: colors.background[0],
    		width: dimensions.rightEdge,
    		height: dimensions.day*days
  		});

    	for(var i = 1; i < days; i++) {
    		rectangle(svg, {
	  			x: dimensions.yaxis,
	    		y: (dimensions.day * i) - dimensions.daySpace,
	    		fill: 'white',
	    		width: dimensions.dayWidth,
	    		height: 1
	  		});
    	}
    };
    

    var drawData = function() {
    	bg.map(function(reading) {
	    	reading.x = dimensions.yaxis + dimensions.leftEdge + dayMilliseconds(reading.date) * timepx;
	    	reading.y = deltaDays(reading.date, new Date()) * dimensions.day + 14;
	    	return reading;
	    });
			
			for(var i  in bg) {	
				shape(bg[i], bg[i].x, bg[i].y, svg);
			}
    };
    drawBackground();
    //drawEvents(pumpEvents);
    drawData();
	};
	return {
		draw: draw,
		scroll: scroll,
		scrollTicks: scrollTicks
	};
};
