module.exports = function(facebook) {
	var me = function() {    
	  return function(request, response, next) {
	  	facebook.setAccessToken(request.query.accessToken);

	  	facebook.api('/me', function(error, user) {
	  		if (error) {
	  			response.json(500, {error: error});
	  			response.end();
	  		}

	  		request.facebook = facebook;
	  		request.fb = {
	  			me: user 
	  		};

	  		next();
	  	});
	  }
	};

	var groups = function() {    
	  return function(request, response, next) {
	  	facebook.setAccessToken(request.query.accessToken);

	  	facebook.api('/me/groups', function(error, groups) {
	  		if (error) {
	  			response.json(500, {error: error});
	  			response.end();
	  		}

	  		request.facebook = facebook;
	  		request.fb.groups = groups;

	  		next();
	  	});
	  }
	};	

	return {
		me: me,
		groups: groups	
	}
};