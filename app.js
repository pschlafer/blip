var express = require('express')
	, http = require('http')
	, engine = require('ejs-locals')
	, less = require('less-middleware')
	, Facebook = require('facebook-node-sdk')
	, app = express();

//setup express
app.engine('ejs', engine);
app.set('template_engine', 'ejs');
app.set('port', process.env.PORT || 8081);
app.set('views', __dirname + '/views');
app.use(express.favicon());
app.use(less({ src: __dirname + '/client' }));
// from facebook example
app.use(express.bodyParser());
app.use(express.cookieParser());
app.use(express.session({ secret: 'foo bar' }));
//app.use(facebook.middleware({ appId: '555596811143941', secret: 'f56ec344bf61fd7bd961577cef1bb073' }));

//routes
app.get('/data', function(request, response) {
	response.render('main.ejs');	
});

//app.get('/connect', facebook.loginRequired({scope: ['user_groups', 'user_birthday', 'user_status', 'user_about_me', 'publish_actions', 'email']}))
app.get('/fb', function(request, response) {
	// me/groups
	var facebook = new Facebook({ appId: '555596811143941', secret: 'f56ec344bf61fd7bd961577cef1bb073' });

	facebook.setAccessToken("CAAH5TZCaRCwUBAOkA1PTNVzhgVKqvgyJ3MYxB3IfOXzzhHk0jHAm4uDIyUlpWzZAkrW6wp3ZBfmUfe6R5Eqbtf7dJAZAHEYNKDU33oZAm7Bx36Tyjq6AdZAfoVdzwRUbgWU3cgwUKerwQ74T83kvXw7tWam19Ngt0ZD");
	facebook.api('/me', function(err, user) {
		console.log(user);
		response.render('main.ejs', user);	
	});
});

/*app.get('/', facebook.loginRequired({scope: ['user_groups', 'user_birthday', 'user_status', 'user_about_me', 'publish_actions', 'email']}), function(request, response) {
	// me/groups
	request.facebook.api('/359767674103279/feed', function(err, user) {
		console.log(user);
		response.render('main.ejs', user);	
	});
});*/


app.get('/login', function(request, response) {
	response.render('login.ejs');
});

app.get('/connect', function(request, response) {
	response.render('connect.ejs');
});

app.get('/play', function(request, response) {
	response.render('play.ejs');
});

app.get('/data', function(request, response) {
	response.render('data.ejs');
});

app.get('/timeline', function(request, response) {
	response.render('timeline.ejs');
});

app.get('/load', function(request, response) {
	response.render('load.ejs');
});

app.get('/', function(request, response) {
	response.render('first.ejs');
});

app.use(express.static(__dirname + '/client'));


//serve 
http.createServer(app).listen(app.get('port'), function(){
  console.log("Blip server listening on port " + app.get('port'));
});