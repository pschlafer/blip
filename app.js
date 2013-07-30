var express = require('express')
	, http = require('http')
	, engine = require('ejs-locals')
	, less = require('less-middleware')
	, facebook = require('facebook-node-sdk')
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
app.use(facebook.middleware({ appId: '421128271330017', secret: 'a596e6eface8203377800d08778b26b8' }));

//routes
app.get('/', facebook.loginRequired({scope: ['user_groups', 'user_birthday', 'user_status', 'user_about_me', 'publish_actions', 'email']}), function(request, response) {
	// me/groups
	request.facebook.api('/359767674103279/feed', function(err, user) {
		console.log(user);
		response.render('main.ejs', user);	
	});
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

app.use(express.static(__dirname + '/client'));

//serve 
http.createServer(app).listen(app.get('port'), function(){
  console.log("Blip server listening on port " + app.get('port'));
});