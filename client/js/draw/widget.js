var averageWidget = function(id, bg, range, options) {
	var dimensions = [37,60];

	var max = 400;
	var paper = Raphael(id, dimensions[0], dimensions[1]);
	var strokeWidth = 2;
	var width = dimensions[0]-strokeWidth*2;
	var height = dimensions[1]-strokeWidth*2;
	
	var pixelScale = height/400;

	var bandheight = (range[1]-range[0])*pixelScale;
	
	var band = paper.rect(strokeWidth, (strokeWidth*2) + height-bandheight-(strokeWidth + (range[0]*pixelScale)), width, (range[1]-range[0])*pixelScale); //width-strokeWidth*2, );

	band.attr('fill','#84C5D9');
	band.attr('stroke-width', 0);

	var c = paper.rect(strokeWidth, strokeWidth, width, height);

	c.attr('stroke', '#B6C6CF');
	c.attr('stroke-width', strokeWidth);

	var circle = paper.circle(width/1.7, (strokeWidth*2) + height-bg*pixelScale, width/7);
	circle.attr('stroke-width', 0);
	circle.attr("fill", "#03B474");


	return {
		update: function(average) {
			var anim = Raphael.animation({cx: width/1.3, cy: (strokeWidth*2) + height-average*pixelScale}, 1);

			circle.animate(anim);
		}
	}
};


			var hba1cWidget = function(id, readings, options) {

				// compute min and max and draw from there within bounds
				var dimensions = [80, 60];

				var scale = dimensions[1]/11;
				var rangeScale = dimensions[1]/200;
				var radius = 5;
				var paper = Raphael(id, dimensions[0], dimensions[1]);

				var drawReading = function(x, reading, last) {
					var y = dimensions[1] - (reading.value - 4)*scale;

					var circle = paper.circle(x, y, radius);	
					circle.attr("fill", "white");
					circle.attr("stroke", last ? "black" : "white");

					var minRange = paper.path("M{0} {1}L{2} {3}",x,y+radius,x,y+radius+reading.min*rangeScale);
					minRange.attr("stroke", last ? "black" : "white");
					var maxRange = paper.path("M{0} {1}L{2} {3}",x,y-radius,x,y-radius-reading.max*rangeScale);
					maxRange.attr("stroke", last ? "black" : "white");

					return {
						x: x,
						y: y,
						reading: reading,
						elements : {
							maxRange: maxRange,
							minRange: minRange,
							circle: circle
						}
					}
				};

				
				var p = [];

				

				var whiteAll = function(p) {
					for(var i in p) {
						p[i].elements.maxRange.attr("stroke", "white");
						p[i].elements.minRange.attr("stroke", "white");
						p[i].elements.circle.attr("stroke", "white");
					}
				};

				var blackOne = function(p) {
					p.elements.maxRange.attr("stroke", "black");
					p.elements.minRange.attr("stroke", "black");
					p.elements.circle.attr("stroke", "black");

					$('#hba1c-stats .percent').text(p.reading.value + '%');
					$('#hba1c-stats .ago').text(p.reading.ago);
				};


				p[0] = drawReading(radius, readings[0]);
				p[1] = drawReading(dimensions[0]/2, readings[1]);
				p[2] = drawReading(dimensions[0] - radius, readings[2], true);


					$('#hba1c-stats .percent').text(p[2].reading.value + '%');
					$('#hba1c-stats .ago').text(p[2].reading.ago);

				p[0].elements.circle.mouseover(function() {
					whiteAll(p);
					blackOne(p[0]);
				});
				p[0].elements.circle.mouseout(function() {
					whiteAll(p);
					blackOne(p[2]);
				});
				
				p[1].elements.circle.mouseover(function() {
					whiteAll(p);
					blackOne(p[1]);
				});
				p[1].elements.circle.mouseout(function() {
					whiteAll(p);
					blackOne(p[2]);
				});

				var line = paper.path("M{0} {1}L{2} {3}L{4} {5}", p[0].x, p[0].y, p[1].x, p[1].y, p[2].x, p[2].y);
				line.attr("stroke", "white");
				line.toBack();
			};