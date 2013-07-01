var express = require('express')
	, http = require('http')
	, engine = require('ejs-locals')
	, less = require('less-middleware')
	, app = express();

//setup express
app.engine('ejs', engine);
app.set('template_engine', 'ejs');
app.set('port', process.env.PORT || 8080);
app.set('views', __dirname + '/views');
app.use(express.favicon());
  
//routes
app.get('/', function(request, response) {
	response.render('index.ejs');
});

app.get('/play', function(request, response) {
	response.render('play.ejs');
});

app.get('/timeline', function(request, response) {
	response.render('timeline.ejs');
});

app.get('/load', function(request, response) {
	response.render('load.ejs');
});

//resources
app.use("/js", express.static(__dirname + '/public/js'));
app.use("/json", express.static(__dirname + '/public/json'));
app.use("/css", express.static(__dirname + '/public/css'));
app.use("/img", express.static(__dirname + '/public/img'));

//serve 
http.createServer(app).listen(app.get('port'), function(){
  console.log("Blip server listening on port " + app.get('port'));
});