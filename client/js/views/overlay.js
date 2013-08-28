$(function() {

var socket = io.connect('http://'+window.location.host);
  socket.on('message', function (message) {
    if(data.user && data.user.id) {
      if(data.user.id == message.userId) {
        $('#overlay_working_message').html(message.text);    
      }
    }
  });

view.overlayWorking = {
  wait: function(text) {
    $('#overlay_working').show();
    $('#overlay_working_message').html(typeof text === 'string' ? text : 'loading');
  },
  hide: function() {
    $('#overlay_working').hide();
  },
};

view.overlay = {
  white: function() {
    view.overlayWorking.hide();
    $('#overlay').css({
  		'background':'rgba(255, 255, 255, 1)',
  		'cursor': 'default',
  		'z-index': -1
  	});
  },
  opaque: function() {
    view.overlayWorking.hide();
    $('#overlay').css({
  		'background':'rgba(0, 0, 0, 0.25)',
  		'cursor': 'default',
  		'z-index': -1
  	});
  },
  wait: function(text) {
    view.overlayWorking.wait(text);
  },
  blank: function() {
    view.overlayWorking.hide();
    $('#overlay').css({
      'background':'rgba(255, 255, 255, 1)',
      'cursor': 'default',
      'z-index': 1000
    });
  }
};

});