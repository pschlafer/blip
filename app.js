var package = require('./package.json');
var config = process.env.NODE_ENV === 'production' ? package.config.prod : package.config.dev;

var express = require('express')
	, http = require('http')
	, engine = require('ejs-locals')
	, less = require('less-middleware')
	, Facebook = require('facebook-node-sdk')
	, app = express();

// setup express
app.engine('ejs', engine);
app.set('template_engine', 'ejs');
app.set('port', process.env.PORT || 8081);
app.set('views', __dirname + '/views');
app.use(express.favicon());
app.use(less({ src: __dirname + '/client' }));
// from facebook example
app.use(express.bodyParser({ keepExtensions: true, uploadDir: './client/img/profile' }));
app.use(express.bodyParser());
app.use(express.cookieParser());
app.use(express.session({ secret: 'foo bar' }));

//routes

app.get('/fb', function(request, response) {
	// me/groups
	var facebook = new Facebook({ appId: '555596811143941', secret: 'f56ec344bf61fd7bd961577cef1bb073' });

	facebook.setAccessToken("CAAH5TZCaRCwUBAOkA1PTNVzhgVKqvgyJ3MYxB3IfOXzzhHk0jHAm4uDIyUlpWzZAkrW6wp3ZBfmUfe6R5Eqbtf7dJAZAHEYNKDU33oZAm7Bx36Tyjq6AdZAfoVdzwRUbgWU3cgwUKerwQ74T83kvXw7tWam19Ngt0ZD");
	facebook.api('/me', function(err, user) {
		console.log(user);
		response.render('main.ejs', user);	
	});
});

app.get('/', function(request, response) {
	response.render('index.ejs', config);
});

app.use(express.static(__dirname + '/client'));

//serve 
http.createServer(app).listen(app.get('port'), function(){
  console.log("Blip server listening on port " + app.get('port'));
});