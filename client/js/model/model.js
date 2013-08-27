$(function() {

model.user = function(callback) {
  $.getJSON('http://'+$('#api_endpoint').attr('content')+'/v1/user?accessToken=' + accessToken + '&callback=?', function(user) {
    data.user = user;
    callback(null, user);
  }).error(function(error) {
  	data.user = null;
    callback(error);
  });
};

model.upload = function(groupId, callback) {
  $.ajax({
    url: 'http://'+$('#api_endpoint').attr('content')+'/v1/' + groupId + '/device/upload',
    type: 'POST',
    crossDomain: true,
    xhr: function() {
      var myXhr = $.ajaxSettings.xhr();
      return myXhr;
    },
    beforeSend: function(){console.log('beforeSend')},
    success: function(data) {
      callback(null, data);
    },
    error: function(error){
      callback(error);
    },
    data: new FormData($('#join_upload_form')[0]),
    cache: false,
    contentType: false,
    processData: false
  });
};

model.groups = {
  get: function(id, callback) {
    $.getJSON('http://'+$('#api_endpoint').attr('content')+'/v1/groups/'+ id + '?accessToken=' + accessToken + '&callback=?', function(group) {
      callback(null, group);
    }).error(function(error) {
      callback(error);
    });    
  },
  select: function(id, callback) {
    $.getJSON('http://'+$('#api_endpoint').attr('content')+'/v1/groups/'+ id + '/select?accessToken=' + accessToken + '&callback=?', function() {
      model.user(function(error, user) {
        console.log('select' , user);
        callback(error, id);
      });
    }).error(function(error) {
      callback(error);
    });
  },
	selectedNotAdmin: function(callback) {
		$.getJSON('http://'+$('#api_endpoint').attr('content')+'/v1/groups?selected=true&administrator=false&accessToken=' + accessToken + '&callback=?', function(groups) {
      callback(null, groups);
    }).error(function(error) {
	    callback(error);
	  });
	},
  administrator: function(callback) {
    $.getJSON('http://'+$('#api_endpoint').attr('content')+'/v1/groups?administrator=true&accessToken=' + accessToken + '&callback=?', function(groups) {
      callback(null, groups);
    }).error(function(error) {
      callback(error);
    });
  }
};


model.post = {
	user: function(callback) {
		$.ajax({
      url: 'http://'+$('#api_endpoint').attr('content')+'/v1/user/join?accessToken=' + accessToken,
      type: 'POST',
      crossDomain: true,
      xhr: function() {
        var myXhr = $.ajaxSettings.xhr();
        return myXhr;
      },
      beforeSend: function(){},
      success: function(data) {

      	var cb = callback;
        console.log('success');
        model.user(function() {
        	cb(null, data);
        });
      },
      error: function(error){
        callback(error);
      },
      data: new FormData($('form')[0]),
      cache: false,
      contentType: false,
      processData: false
    });
	}
}

});