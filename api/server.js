var config = require('./package.json').config.dev;
var express = require('express')
	, http = require('http')
	, mongojs = require('mongojs')	
	, db = mongojs(config['mongodb-connection-string'], ['deviceData','groups','device'])
	, facebook = require('facebook-node-sdk')
	, _ = require('underscore')
	, common = require('common')
	, app = express()
	, facebookScope = ['user_groups', 'user_birthday', 'user_status', 'user_about_me', 'publish_actions', 'email'];
//setup express
app.set('port', process.env.PORT || 8082);
// from facebook example
app.use(express.bodyParser());
app.use(express.cookieParser());
app.use(express.session({ secret: 'foo bar' }));
app.use(facebook.middleware({ appId: config['facebook-app-id'], secret: config['facebook-app-secret'] }));

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

app.get('/groups', facebook.loginRequired({scope: facebookScope}), function(request, response) {
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

app.get('/groups/:id/select', facebook.loginRequired({scope: facebookScope}), function(request, response) {
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
		function(group) {
			response.json({allGood: true});
		}],
		errorResponse(response)
	);
});

app.get('/groups/:id', facebook.loginRequired({scope: facebookScope}), function(request, response) {
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

var mongo = require('mongodb');
var BSON = mongo.BSONPure;


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
			
			var query = type ? {deviceId: d_id, type: type} : {deviceId: d_id};

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
		}
	], function(err) {
					response.json(500, {
						error: err
					});
			}
	);
});

//serve 
http.createServer(app).listen(app.get('port'), function(){
  console.log("Blip Api server listening on port " + app.get('port'));
});