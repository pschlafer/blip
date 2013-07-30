var express = require('express')
	, http = require('http')
	, mongojs = require('mongojs')
	, db = mongojs('mongodb://root:root@dharma.mongohq.com:10022/blip', ['deviceData'])
	, facebook = require('facebook-node-sdk')
	, _ = require('underscore')
	, app = express()
	, facebookScope = ['user_groups', 'user_birthday', 'user_status', 'user_about_me', 'publish_actions', 'email'];
//setup express
app.set('port', process.env.PORT || 8082);
// from facebook example
app.use(express.bodyParser());
app.use(express.cookieParser());
app.use(express.session({ secret: 'foo bar' }));
app.use(facebook.middleware({ appId: '421128271330017', secret: 'a596e6eface8203377800d08778b26b8' }));

// startTime endTime
//routes
app.get('/', facebook.loginRequired({scope: facebookScope}), function(request, response) {
	var limit = parseInt(request.query.limit || '100');;
	var skip = parseInt(request.query.skip || '0');
	var type = request.query.type;


	var query = type ? {type: type} : {};


	if(request.query.unixTimeUTC) {
		if(request.query.unixTimeUTC.indexOf(':') === -1) {
			query.unixTimeUTC = parseInt(request.query.unixTimeUTC);
		}
		else if(request.query.unixTimeUTC.indexOf(':') === 0) {
			query.unixTimeUTC = {};
			query.unixTimeUTC.$lte = parseInt(request.query.unixTimeUTC.substring(1));
		} 
		else if(request.query.unixTimeUTC.indexOf(':') ===  request.query.unixTimeUTC.length - 1) {
			query.unixTimeUTC = {};
			query.unixTimeUTC.$gte = parseInt(request.query.unixTimeUTC.substring(0, request.query.unixTimeUTC.length - 1));	
		}
		else {
			query.unixTimeUTC = {};
			query.unixTimeUTC.$gte = parseInt(request.query.unixTimeUTC.split(':')[0]);			
			query.unixTimeUTC.$lte = parseInt(request.query.unixTimeUTC.split(':')[1]);			
		}
	}

	if(request.query.unixTime) {
		if(request.query.unixTime.indexOf(':') === -1) {
			query.unixTime = parseInt(request.query.unixTime);
		}
		else if(request.query.unixTime.indexOf(':') === 0) {
			query.unixTime = {};
			query.unixTime.$lte = parseInt(request.query.unixTime.substring(1));
		} 
		else if(request.query.unixTime.indexOf(':') ===  request.query.unixTime.length - 1) {
			query.unixTime = {};
			query.unixTime.$gte = parseInt(request.query.unixTime.substring(0, request.query.unixTime.length - 1));	
		}
		else {
			query.unixTime = {};
			query.unixTime.$gte = parseInt(request.query.unixTime.split(':')[0]);			
			query.unixTime.$lte = parseInt(request.query.unixTime.split(':')[1]);			
		}
	}

	console.log(query, limit, skip);
	// todo add access control, now you just need to be logged in to facebook to see the data
	// i need to see if you have access to the group instead. use group id to get device id
	// this query should include the device id

	db.deviceData.find(query).limit(limit).skip(skip).sort({unixTimeUTC:-1}, function(err, data) {
		if (err) {
			response.json(500, {
				error: err
			});
			return;
		}

		response.json(data);
	});
});

//serve 
http.createServer(app).listen(app.get('port'), function(){
  console.log("Blip Api server listening on port " + app.get('port'));
});