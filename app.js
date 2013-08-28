var package = require('./package.json');
var config = process.env.NODE_ENV === 'production' ? package.config.prod : package.config.dev;

var express = require('express')
	, http = require('http')
	, engine = require('ejs-locals')
	, less = require('less-middleware')
	, Facebook = require('facebook-node-sdk')
	, app = express()
	, needle = require('needle')
	, upload = require('./lib/upload');

var mongojs = require('mongojs')	
	, fs = require('fs')
	, es = require('event-stream')
	, db = mongojs(config.mongodb_connection_string, ['deviceData','groups'])
	, mmcsv = require('./lib/parsers/mmcsv');

// todo: add time zone origin parameter, it now assumes that user is in SF summer time
var pstTime = function(time) { var date = new Date(time);var utc = toUTC(date);utc.setHours(date.getHours() - 7);return utc; };
var toUTC = function(date) { return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds()); }

app.engine('ejs', engine);
app.set('template_engine', 'ejs');
app.set('port', process.env.PORT || 8081);
app.set('views', __dirname + '/views');
app.use(express.favicon());
app.use(less({ src: __dirname + '/client' }));
app.use(express.bodyParser({ keepExtensions: true, uploadDir: './client/img/profile' }));
app.use(express.bodyParser());
app.use(express.cookieParser());
app.use(express.session({ secret: 'foo bar' }));

//Routes

app.get('/', function(request, response) {
	response.render('index.ejs', config);
});

// post to api server
app.post('/v1/user/join', function(request, response) {
	var data = 'data=' + request.body.data;
	var url = 'http://' + config.api_endpoint + '/v1/user/join?accessToken=' + request.query.accessToken;

	needle.post(url, data, function(error, postResponse, body){
		console.log(error, postResponse, body);

	  response.json(error ? 500 : 200, error ? {error: error} : body);
	});
});

// todo: multiform upload to api. It now writes dirrectly to the api db, a workaround for post request file upload issue.
app.post('/v1/:groupId/device/upload', function(request, response) {
	if(request.query.userId) {
		io.sockets.emit('message', {userId: request.query.userId, text: 'Upload complete'});
	}

	var count = 0;
	db.deviceData.remove({groupId: request.params.groupId}, function() {
		if(request.query.userId) {
			io.sockets.emit('message', {userId: request.query.userId, text: 'Removed old Entries'});
		}
		es.pipeline(fs.createReadStream(request.files.medtronic.path), mmcsv.all().on('data',
			function(raw) {
				var entry = JSON.parse(raw);
				count++;
				if(request.query.userId && !(count%100)) {
					io.sockets.emit('message', {userId: request.query.userId, text: 'Parsed ' + count + ' Entries'});
				}
				entry.groupId = request.params.groupId;
				entry.unixTimeUTC = toUTC(new Date(entry.time)).getTime();
				entry.unixTime = pstTime(entry.time).getTime();
				entry.company = 'medtronic';

				console.log(entry);
		    db.deviceData.save(entry, function(){});
		  }).on('end', function() {
		  	if(request.query.userId) {
					io.sockets.emit('message', {userId: request.query.userId, text: 'Parsing Complete. ' + count + ' Entries'});
				}
		  	console.log('done parsing medtronic');

		  	db.groups.findOne({id: request.params.groupId}, function(err, group) {
		  		group.uploadId = guid();

		  		if(err) {
		  			response.json(500, { error: 'group by given id not found' });		  		
		  			return;
		  		}
		  		db.groups.save(group, function(err, done) {
		  			if(err) {
			  			response.json(500, { error: 'could not save group' });		  		
			  			return;
			  		}
		  			response.json(200, { done: true });
		  		})
					
		  	});
		  })
		);
	});
});

function s4() {
  return Math.floor((1 + Math.random()) * 0x10000)
             .toString(16)
             .substring(1);
};

function guid() {
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
         s4() + '-' + s4() + s4() + s4();
}

//Serve 

var server = http.createServer(app);

server.listen(app.get('port'), function(){
  console.log("Blip server listening on port " + app.get('port'));
});

var io = require('socket.io').listen(server);

app.use(express.static(__dirname + '/client'));
