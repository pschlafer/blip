var config = require('./package.json').config.dev;
var express = require('express')
	, http = require('http')
	, mongojs = require('mongojs')	
	, db = mongojs(config['mongodb-connection-string'], ['deviceData','groups','device', 'users'])
	, Facebook = require('facebook-node-sdk')
	, _ = require('underscore')
	, common = require('common')
	, app = express()
	, mongo = require('mongodb')
	, fbfeed = require('./fb-feed')
	, BSON = mongo.BSONPure
	, querystring = require('querystring') 
	, facebookScope = ['user_groups', 'user_birthday', 'user_status', 'user_about_me', 'publish_actions', 'email'];
var facebook = new Facebook({ appId: '555596811143941', secret: 'f56ec344bf61fd7bd961577cef1bb073' });
var fbWare = require('./fb-ware')(facebook);

app.set('port', process.env.PORT || 8082);
app.use(express.bodyParser());
app.use(express.cookieParser());
app.use(express.session({ secret: 'foo bar' }));

// join a user
app.post('/v1/join', fbWare.me(), function(request, response) {
	var user = request.body;

	user.id = request.fb.me.id;

	user.picture = request.files.picture;

	db.users.save(user, function(error) {
		if (error) {
			errorResponse(response)(error);
		}

		response.json(user);
	});
});

app.get('/v1/user/facebook', fbWare.me(), function(request, response) {

	request.fb.me.picture = 'https://graph.facebook.com/' + request.fb.me.id + '/picture';
	
	response.jsonp(request.fb.me);
});

// is a user
app.get('/v1/user', fbWare.me(), function(request, response) {
	db.users.find({id: request.fb.me.id}, function(error, user) {
		if (error) {
			errorResponse(response)(error);
		}

		response.jsonp(user);
	});
});

app.get('/v1/groups', fbWare.me(), function(request, response) {
	common.step([
		function(next) {
			request.facebook.api('/me/groups', next.parallel());
			db.groups.find({userId: request.fb.me.id}, next.parallel());
		},
		function(groups) {
			var data = groups[0].data.map(function(group) {
				var dbGroup = _.findWhere(groups[1], {id: group.id});

				if (dbGroup) {
					group.selected = dbGroup.selected;
				}
				
				//todo: add picture to group when posting to the api
				var group = {
					name: group.name,
					id: group.id,
					administrator: group.administrator,
					selected: !!group.selected
				};

				if ((request.query.administrator || '').toLowerCase() === 'true') {
					if (group && !group.administrator) {
						group = null;
					}
				}

				if ((request.query.selected || '').toLowerCase() === 'true') {
					if (group && !group.selected) {
						return null;
					}
				}

				if ((request.query.selected || '').toLowerCase() === 'false') {
					if (group && group.selected) {
						return null;
					}
				}

				return group;
			});

			console.log('response', JSON.stringify(_.compact(data)));
			response.jsonp(_.compact(data));
		}],
		errorResponse(response)
	);
});

app.get('/v1/groups/:id', fbWare.me(), function(request, response) {
	var group = {};

	common.step([
		function(next) {
			request.facebook.api('/' + request.params.id, next);
		},
		function(data, next) {
			group.id = request.params.id;

			group.patient = {
				name: data.name || "",
				description: data.description || "",
				picture: 'https://graph.facebook.com/' + data.owner.id + '/picture'
			};

			request.facebook.api('/' + request.params.id + '/members', next);
		},
		function(data, next) {
			group.team = data.data.map(function(user) {
				return {
					name: user.name,
					id: user.id,
					picture: 'https://graph.facebook.com/' + user.id + '/picture'
				}
			});

			db.groups.findOne({id: request.params.id}, next);
		},
		function(entry, next) {
			group.devices = [];

			if(entry) {
				group.devices = entry.devices || [];
			}

			response.jsonp(group);
		}],
		errorResponse(response)
	);
});

app.get('/v1/group/:id/select', fbWare.me(), function(request, response) {
	var query;

	common.step([
		function(next) {
			query = {userId: request.fb.me.id, id: request.params.id};

			db.groups.findOne(query, next);
		},
		function(group, next) {
			if(!group) {
				group = query;
			}

			group.selected = !group.selected;

			db.groups.save(group, next);
		},
		function(d, next) {
			db.groups.findOne(query, next);
		},
		function(d, next) {
			response.json(d);
		}],
		errorResponse(response)
	);
});

// all devices
app.get('/v1/device', function() {
});

// new device data 
/*
app.post('/v1/device', function(request, response) {
	common.step([
		function(next) {
			if(!request.files.data) {
				next({error: 'data file missing'});
			}
			request.facebook.api('/me', next);
		},
		function(me, next) {
			db.groups.save({type: request.body.type}, next.parallel('entry'));
			fs.readFile(request.files.data.path, 'utf8', next.parallel('text'));	
		},
		function(datum, next) {
			db.deviceData.save(deviceParser(datum.text, datum.entry), next);
		},								
		function() {
			response.json({deviceDate.id, deviceData});
		}],
		errorResponse(response)
	);
		function(group, next) {
			if(!group) {
				group = query;
			}

			group.selected = !group.selected;

			db.groups.save(group, next);
		},
		function(d, next) {
			db.groups.findOne(query, next);
		},
		function(d, next) {
			response.json(d);
		}],
		
	);
});

app.post('/v1/group/:id/data', function(request, response) {
  common.step([
		function(next) {
			if(!request.files.data) {
				next({error: 'data file missing'});
			}

			request.facebook.api('/me', next);
		},
		function(me, next) {
			db.device.find({id: request.params.id}, next.parallel('entry'));
			fs.readFile(request.files.data.path, 'utf8', next.parallel('text'));	
		},
		function(datum, next) {
			db.device.save(deviceParser(datum.entry. datum.text));
		},
		function() {
			response.json({})
		},
		

		function(group, next) {
			if(!group) {
				group = query;
			}

			group.selected = !group.selected;

			db.groups.save(group, next);
		},
		function(d, next) {
			db.groups.findOne(query, next);
		},
		function(d, next) {
			response.json(d);
		}],
		errorResponse(response)
	);
  response.end();
});

// new device
app.post('/device', function(request, response) {
  
  response.writeHead(200, {'Content-Type': 'text/html'});
  response.write('body: ' + JSON.stringify(request.body));
  response.write('files: ' + JSON.stringify(request.files));

  common.step([
		function(next) {
			if(!request.files.data) {
				next({error: 'data file missing'});
			}

			request.facebook.api('/me', next);
		},
		function(me, next) {
			db.device.find({id: request.params.id}, next.parallel('entry'));
			fs.readFile(request.files.data.path, 'utf8', next.parallel('text'));	
		},
		function(datum, next) {
			db.device.save(deviceParser(datum.entry. datum.text));
		},
		function() {
			response.json({})
		},
		

		function(group, next) {
			if(!group) {
				group = query;
			}

			group.selected = !group.selected;

			db.groups.save(group, next);
		},
		function(d, next) {
			db.groups.findOne(query, next);
		},
		function(d, next) {
			response.json(d);
		}],
		errorResponse(response)
	);
  response.end();
});

// new data for existing device
app.post('/v1/device/:id', function(request, response) {
  var body = '';
  
  request.on('data', function (data) {
      body += data;
      console.log("Partial body: " + body);
  });

  request.on('end', function () {
      console.log("Body: " + body);
  });

  response.writeHead(200, {'Content-Type': 'text/html'});
  response.end('post received');
});


app.post('/v1/device/:id/delete', function(request, response) {
  // delete the device
});

// add post for /messages/post /messages/id/comment/post https://graph.facebook.com/[ POST_FBID ]/comments/?access_token=[ ACCESS_TOKEN ]&message=[ MESSAGE]

app.get('/v1/comment/:id/post', facebook.loginRequired({scope: facebookScope}), function(request, response) { 
	https://graph.facebook.com/[ POST_FBID ]/comments/?access_token=[ ACCESS_TOKEN ]&message=[ MESSAGE]
	request.facebook.api('/' + request.params.id + '/feed?' + querystring.stringify(request.query), next);
});

app.get('/v1/group/:id/messages', facebook.loginRequired({scope: facebookScope}), function(request, response) {
	common.step([
		function(next) {
			request.facebook.api('/' + request.params.id + '/feed?' + querystring.stringify(request.query), next);
		},
		function(data, next) {
			response.json(fbfeed.normalize(data));
		}
	],
		errorResponse(response)
	);
});

// find a good way deal with paging using id's
app.get('/v1/device/:id', facebook.loginRequired({scope: facebookScope}), function(request, response) {
	// todo just get device data for this one person
	var d_id = new BSON.ObjectID(request.params.id);
	var device;

	common.step([
		function(next) {
			db.device.findOne({_id: d_id}, next);
		},
		function(d, next) {
			if(!d) {
				next({error: 'device not found'});
			}
			device = d;
			request.facebook.api('/me/groups', next);
		},
		function(groups, next) {
			if(!_.findWhere(groups.data, {id: device.groupId})) {
				next({error: 'seems like you dont have access to see this data'});
			}
			
			var limit = parseInt(request.query.limit || '100');;
			var skip = parseInt(request.query.skip || '0');
			var type = request.query.type;
			var query = {deviceId: d_id};

			if(type) {
				query.type = type;
			}

			if(request.query.since || request.query.until) {
				query.unixTime = {};	

				if(request.query.since) {
					query.unixTime.$gte = parseInt(request.query.since);
				}

				if(request.query.until) {
					query.unixTime.$lte = parseInt(request.query.until);
				}
			}

			db.deviceData.find(query).limit(limit).skip(skip).sort({unixTimeUTC:-1}, next);
		},
		function(entries) {
			response.json(entries);
		}
	],
	errorResponse(response));
});
*/
var errorResponse = function(response) {
	return function(error) {
		response.json(500, {error: error});	
	}
};

//serve 
http.createServer(app).listen(app.get('port'), function(){
  console.log("Blip Api server listening on port " + app.get('port'));
});