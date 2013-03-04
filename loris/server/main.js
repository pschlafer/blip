//
// Copyright (c) 2012-2013 GreenDot Diabetes, Inc.; all rights reserved
//
var path = require('path');
var restify = require('restify');
var dt = require('./datatransfer.js');
var api = require('./rest_api');
var opt = require('./config');

if (opt.disconnected || opt.facebook == undefined) {
    console.log('Facebook token validation disabled');
    api.disable_fb_check = true;
}

//
// Create the restify webserver
//
var server = restify.createServer();

server.use(restify.queryParser());
server.use(restify.bodyParser());

///////////////////////////////////////////////////////////////////////////////
// restify Endpoint handlers
///////////////////////////////////////////////////////////////////////////////

//
// Homepage gets routed to client/index.html
//
server.get(/^\/?$/, function(request, response, next) {
    dt.sendfile('client/index.html', response);
    return next();
});

//
// REST API handlers
//
server.get('/api/:apiversion/fb-info', function(request, response, next) {
    api.get_fb_info(request, response);
});

server.get('/api/:apiversion/groups/:group/sources', function(request, response, next) {
    api.get_sources(request, response);
    return next();
});
server.post('/api/:apiversion/groups/:group/sources', function(request, response, next) {
    api.add_source(request, response);
    return next();
});
server.del('/api/:apiversion/groups/:group/sources/:srcid', function(request, response, next) {
    api.remove_source(request, response);
    return next();
});

server.get('/api/:apiversion/groups/:group/sources/:srcid/sync', function(request, response, next) {
    api.get_src_sync_status(request, response);
    return next();
});
server.post('/api/:apiversion/groups/:group/sources/:srcid/sync', function(request, response, next) {
    api.sync_src(request, response);
    return next();
});

server.get('/api/:apiversion/groups/:group/sources/:srcid/:resource', function(request, response, next) {
    api.get_group_data(request, response);
    return next();
});

//
// Source plugin images are exported through /srcimg
//
server.get('/srcimg/:filename', function(request, response, next) {
    if (request.params.filename.indexOf('.png') !== -1 ||
      request.params.filename.indexOf('.jpg') !== -1 ||
      request.params.filename.indexOf('.gif') !== -1) {
        dt.sendfile('./source_plugins/' + request.params.filename, response);
    } else {
        dt.senderror(404, '', response);        
    }

    return next();
});

//
// everything else that doesn't contain '..' gets routed to ./client
//
server.get(/^(?:(?!\.\.).)*$/, function(request, response, next) {
    dt.sendfile('./client' + request.url, response);
    return next();
});

//
// stuff with '..' gets a 404 by default
//
server.get('.*', function(request, response, next) {
    dt.senderror(404, '', response);
    return next();
});

///////////////////////////////////////////////////////////////////////////////
// Start the server
///////////////////////////////////////////////////////////////////////////////
server.listen(opt.port, function() {
    console.log('Server running at %s', server.url);
});
