var config = require('./package.json').config.dev;
var express = require('express')
	, http = require('http')
	, mongojs = require('mongojs')	
	, db = mongojs(config['mongodb-connection-string'], ['deviceData','groups','device'])
	, facebook = require('facebook-node-sdk')
	, _ = require('underscore')
	, common = require('common')
	, app = express()
	, mongo = require('mongodb')
	, fbfeed = require('./fb-feed')
	, BSON = mongo.BSONPure
	, querystring = require('querystring')
	, facebookScope = ['user_groups', 'user_birthday', 'user_status', 'user_about_me', 'publish_actions', 'email'];
	
app.set('port', process.env.PORT || 8082);
app.use(express.bodyParser());
app.use(express.cookieParser());
app.use(express.session({ secret: 'foo bar' }));
app.use(facebook.middleware({ appId: config['facebook-app-id'], secret: config['facebook-app-secret'] }));

// missing messages and threads // and write message and write message in thread
// push data to device.
// startTime endTime
//routes

/*
get groups

/groups 

[{
	name:'',
	id:''	
}]

/group/id
{
	name:
	id:
	
	patient: {
	
	},
	team: {
		
	},
	devices: {
	
	}
}

/group/id/select

toggle selected groups

// later

/group/id/messages/

{
	
}

/group/id/messages/thread/id

{
	
}
*/

var errorResponse = function(response) {
	return function(error) {
		response.json(500, {
			error: error
		});	
	}
};

app.get('/group', facebook.loginRequired({scope: facebookScope}), function(request, response) {
	common.step([
		function(next) {
			request.facebook.api('/me', next);
		},
		function(me, next) {
			request.facebook.api('/me/groups', next.parallel());
			db.groups.find({userId: me.id}, next.parallel());
		},
		function(groups) {
			var data = groups[0].data.map(function(group) {
				var dbGroup = _.findWhere(groups[1], {id: group.id});

				if (dbGroup) {
					group.selected = dbGroup.selected;
				}
				
				var group = {
					name: group.name,
					id: group.id,
					selected: !!group.selected
				};

				if ((request.query.selected || '').toLowerCase() === 'true') {
					if (group.selected) {
						return group;
					}
					return;
				}
				return group;
			});

			response.json(_.compact(data));
		}],
		errorResponse(response)
	);
});

app.get('/group/:id', facebook.loginRequired({scope: facebookScope}), function(request, response) {
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

			response.json(group);
		}],
		errorResponse(response)
	);
});

app.get('/group/:id/select', facebook.loginRequired({scope: facebookScope}), function(request, response) {
	var query;

	common.step([
		function(next) {
			request.facebook.api('/me', next);
		},
		function(me, next) {
			query = {userId: me.id, id: request.params.id};

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

app.get('/group/:id/messages', facebook.loginRequired({scope: facebookScope}), function(request, response) {
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
// post comments too
app.get('/device/:id', facebook.loginRequired({scope: facebookScope}), function(request, response) {
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

//serve 
http.createServer(app).listen(app.get('port'), function(){
  console.log("Blip Api server listening on port " + app.get('port'));
});