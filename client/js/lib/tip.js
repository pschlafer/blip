var tip = function() {

	$('#tip').mousemove(function() {
		hide();
	});

	var show = function(top, left, title) {
		$('#tip').show();

		$('#tip').mousemove(function() {
			$('#tip').hide();
		});
		$('#tip').html(common.format('<div class="tipsy tipsy-s" style="top: {0}px; left: {1}px; visibility: visible; display: block; opacity: 0.8;"><div class="tipsy-arrow tipsy-arrow-s"></div><div class="tipsy-inner">{2}</div></div>', top, left, title));	
	}
	
	var hide = function() {
		$('#tip').hide();
	}

	return {
		show: show,
		hide: hide
	}
}();