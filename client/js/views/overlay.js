$(function() {

view.overlay = {
  white: function() {
    $('#overlay').css({
  		'background':'rgba(255, 255, 255, 1)',
  		'cursor': 'default',
  		'z-index': -1
  	});
  },
  opaque: function() {
    $('#overlay').css({
  		'background':'rgba(0, 0, 0, 0.25)',
  		'cursor': 'default',
  		'z-index': -1
  	});
  },
  wait: function() {
  	$('#overlay').css({
  		'background':'rgba(181, 185, 190, 0.6)',
  		'cursor': 'wait',
  		'z-index': 1000
  	});
  }
};

});