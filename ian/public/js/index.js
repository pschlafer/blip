

    function convertDateToUTC(date) { return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds()); }

		var parseTime = function(time) {
			var d = convertDateToUTC(new Date(time));

			d.setHours(d.getHours() - 7);

			return d;
		};

		var dayId = function(time) {
			return time.getDate() + '-' + time.getMonth() + '-' + time.getYear();
		};

		var dayMinutes = function(time) {
			return time.getHours() * 60 + time.getMinutes();
		};

		var getDays = function() {
			var days = _.groupBy(bg, function(reading){ 

				return dayId(parseTime(reading.time));
			});

			return days;
		};


		var shape = function(reading, x, y) {
			var blue = '#41A5C5';
			
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

				if(reading.bg >= range.low && reading.bg <= range.high) {
					color = range.color;
					shape = range.shape;
				}
			}


			var time = parseTime(reading.time);
			var id = dayId(time) + '-' + dayMinutes(time);

			var point;
			switch(shape) {
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
			point.attr('class','Chartppoint');
			
			$('#' + id).hover(
				function() {
					$(this).css('opacity',.2);
			},function() {
					$(this).css('opacity',1);
			})
			$('#' + id).click(function() {
				$('#one').trigger('click');
				timeline.scroll(reading.date);
			});
	    $('#' + id).tipsy({ 
        gravity: 'w', 
        html: true, 
        title: function(title) {
          return function() { return title}; 
      //  }('BG ' + reading.bg + ' ' + parseTime(reading.time))
      	}(reading.bg + ' @ ' + moment(parseTime(reading.time)).format("hA ddd Do"))
      });
		};

		var draw = function() {
			readingCount = 0;
      readingSum = 0;
			var days = getDays();
			var width = 980;
			var rowHeight = 36;
			var xOffset = 25;
			var yOffset = 15;
			var today = new Date();
			var dayIds = ['su', 'm', 't', 'w', 't', 'f', 's'];

			var row = svgContainer.append("rect")
	        .attr('x', xOffset + 0)
	        .attr('y', yOffset)
          .attr("width", width)
          .attr('fill', 'white')
          .attr("height", rowHeight);

				var slots = ['12 AM', '3 AM', '6 AM', '9 AM', '12 PM', '3 PM', '6 PM' ,'9 PM', '12 AM'];

				for(var k = 0; k < slots.length; k++) {
					svgContainer.append("rect")
	        .attr('x', xOffset + width/8 * k)
	        .attr('y', 0)
          .attr("width", 1)
          .attr('fill', '#B7C9D2')
          .attr("height", 18);

					svgContainer.append('text')
						.attr('x', xOffset + width/8 * k + 5)
						.attr('y', 15)
						.attr('fill', '#0081AA')
						.attr('font-family',"sans-serif")
						.attr('text-anchor',"start")
						.attr('font-size', 11)
						.text(slots[k]);			
				}

				for(var k = 0; k < slots.length; k++) {
					svgContainer.append("rect")
	        .attr('x', xOffset + width/8 * k)
	        .attr('y', + yOffset + rowHeight*14 + 4)
          .attr("width", 1)
          .attr('fill', '#B7C9D2')
          .attr("height", 18);

					svgContainer.append('text')
						.attr('x', xOffset + width/8 * k + 5)
						.attr('y', rowHeight*14 + 33)
						.attr('fill', '#0081AA')
						.attr('font-family',"sans-serif")
						.attr('font-size', 11)
						.text(slots[k]);			
				}


			for(var i = 1; i <= 14; i++) {
				if(i>1)
				today.setDate(today.getDate()-1);

				if(today.getDay() != 5 && today.getDay() != 6) {
					svgContainer.append('text')
						.attr('x', 0)
						.attr('y', yOffset + i * rowHeight - rowHeight/2 + 5)
						.attr('fill', '#AAB9C0')
						.attr('class', 'ptext')
						.attr('font-family',"sans-serif")
						.attr('text-anchor',"start")
						.attr('font-size', 13)
						.text(dayIds[today.getDay()]);	
				} else {
					svgContainer.append('text')
						.attr('x', 0)
						.attr('class', 'ptext')
						.attr('y', yOffset + i * rowHeight - rowHeight/2)
						.attr('fill', '#0081AA')
						.attr('font-family',"sans-serif")
						.attr('font-size', 13)
						.text(dayIds[today.getDay()]);	

					svgContainer.append('text')
						.attr('x', 0)
						.attr('class', 'ptext')
						.attr('y', yOffset + i * rowHeight - rowHeight/2 + 12)
						.attr('fill', '#0081AA')
						.attr('font-family',"sans-serif")
						.attr('font-size', 10)
						.text(today.getMonth()+'/'+today.getDate());	
				}
				
				var day = days[dayId(today)];

				var shades = ['#DBE4E9','#E2E9ED','#E9EFF1','#F7F8F9','#F7F8F9','#E9EFF1','#E2E9ED','#DBE4E9'];

				for(var k = 0; k < shades.length; k++) {
					var row = svgContainer.append("rect")
		        .attr('x', xOffset + width/8 * k)
		        .attr('y', yOffset +rowHeight * (i-1) + 3)
	          .attr("width", width/8)
	          .attr('fill', shades[k])
	          .attr("height", rowHeight);	
				}

				var row = svgContainer.append("rect")
		        .attr('x', xOffset + width/8 * 8)
		        .attr('y', yOffset +rowHeight * (i-1) + 3)
	          .attr("width", width/8/2)
	          .attr('fill', shades[6])
	          .attr("height", rowHeight);	
				
				if(i < 14) {
				var row = svgContainer.append("rect")
	        .attr('x', xOffset + 0)
	        .attr('y', yOffset + rowHeight * (i-1) + rowHeight)
          .attr("width", width + width/8/2)
          .attr('fill', 'white')
          .attr("height", 3);
        }
       	
				

				if(day) {
					for(var j in day) {
						var reading = day[j];
	          var time = parseTime(reading.time);
						
						readingCount++;
						readingSum = readingSum + parseInt(reading.bg);

						
						var daypx = 980;
						var oneDay = 1000*60*60*24;
						var timepx = daypx/oneDay;

						var x = dayMinutes(time)*60*1000 * timepx;

	          var y = yOffset + i * rowHeight - rowHeight/2;
						shape(reading, x, y);
					}
				}
			}
			$('#averageData').text(Math.round(readingSum/readingCount));
		}
		var since = function(s,e) {
	var oneDay = 24*60*60*1000; // hours*minutes*seconds*milliseconds

  return Math.ceil(Math.abs((s.getTime() - e.getTime())/(oneDay)));
};

		var redraw = function(minus, dateStart) {
      if(!minus) minus = 0;

			console.log(dateStart);

			readingCount = 0;
      readingSum = 0;

			$('.Chartppoint').unbind();
			$('.Chartppoint').remove();
			$('.ptext').remove();

			var days = getDays();
			var width = 980;
			var rowHeight = 36;
			var xOffset = 25;
			var yOffset = 15;
			var today = new Date();
			var dayIds = ['su', 'm', 't', 'w', 't', 'f', 's'];

			if(dateStart) {
				//console.log('since', since(today,dateStart));
				count = since(startOfDay(today),startOfDay(dateStart));
				minus = count;
			}

			today.setDate(today.getDate()-minus);



			for(var i = 1; i <= 14; i++) {
				if(i>1)
				today.setDate(today.getDate()-1);
				
				if(today.getDay() != 5 && today.getDay() != 6) {
					svgContainer.append('text')
						.attr('x', 0)
						.attr('y', yOffset + i * rowHeight - rowHeight/2 + 5)
						.attr('fill', '#AAB9C0')
						.attr('class', 'ptext')
						.attr('font-family',"sans-serif")
						.attr('text-anchor',"start")
						.attr('font-size', 13)
						.text(dayIds[today.getDay()]);	
				} else {
					svgContainer.append('text')
						.attr('x', 0)
						.attr('class', 'ptext')
						.attr('y', yOffset + i * rowHeight - rowHeight/2)
						.attr('fill', '#0081AA')
						.attr('font-family',"sans-serif")
						.attr('font-size', 13)
						.text(dayIds[today.getDay()]);	

					svgContainer.append('text')
						.attr('x', 0)
						.attr('class', 'ptext')
						.attr('y', yOffset + i * rowHeight - rowHeight/2 + 12)
						.attr('fill', '#0081AA')
						.attr('font-family',"sans-serif")
						.attr('font-size', 10)
						.text(today.getMonth()+'/'+today.getDate());	
				}
			
			var day = days[dayId(today)];
			if(day) {
					for(var j in day) {
						var reading = day[j];

						readingCount++;
						readingSum = readingSum + parseInt(reading.bg);


			      var time = parseTime(reading.time);
						
						var x = dayMinutes(time) * width/1440;

	          var y = yOffset + i * rowHeight - rowHeight/2;
						shape(reading, x, y);
					}
				}
			}

			$('#chartMain').scroll(function() {
				$('#averageData').text(Math.round(readingSum/readingCount));
			});
			
		}
