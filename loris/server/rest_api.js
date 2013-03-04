//
// Copyright (c) 2012-2013 GreenDot Diabetes, Inc.; all rights reserved
//
var http = require('http');
var https = require('https');
var dt = require('./datatransfer');
var srclist = require('./srclist');
var spm = require('./src_plugin_manager');

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
// FB Validation
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

var MAX_TOKEN_TABLE_ENTRIES = 16 * 1024;    // When the table reaches 16k entries, we stop caching new tokens and we send everything to FB

var LRU = require('lru');
var token_cache = new LRU.LRU(MAX_TOKEN_TABLE_ENTRIES);

token_cache.callback = function(key) {
    var that = this;

    return {
        success:function() {
            var entry = that.get(key);
            entry.pending = false;
            for(var j = 0; j < entry.actions.length; j++) {
                entry.actions[j].success();
            }
        },
        fail:function(msg) {
            var entry = that.get(key);
            for(var j = 0; j < entry.actions.length; j++) {
                entry.actions[j].fail(msg);
            }
            //XXX seems like we should cache negative results too (for a short time)
            // instead of just deleting the entry (to obey facebook rate limiting rules)
            that.remove(key);
        }
    };
};

function call_facebook(group, token, action) {
    var path = '/' + group + '?access_token=' + token;
    //
    // Call facebook
    //
    var fboptions = {
    host: 'graph.facebook.com',
    port: 443,
    path: path,
    method: 'GET'
    };

    https.request(fboptions, function(res) {
        if (res.statusCode === 200) {
        //
        // facebook is happy, proceed
        //
        action.success();
    } else {
        //
        // facebook is not happy, return an error 
        //
        action.fail('facebook authentication failed: ' + path);
    }
    }).on('error', function(e) {
        action.fail('facebook connection failed');
    }).end();
}

//
// Facebook token validation
// XXX maybe this should be called "fb_check_access"?,
// validating the token is an implied part of checking access,
// which is what we really want to do
// 
function fb_check_access(group, token, action) {
    if (exports.disable_fb_check) {
	action.success();
	return;
    }

    //
    // Make sure the request has a token
    //
    if (!token) {
        action.fail('facebook access token not provided');
        return;
    }

    //
    // Extract the entry from the cache
    //
    var key = group + token;
    var entry = token_cache.get(key);

    //
    // Does the entry exist in the cache?
    //
    if (entry) {
        if (entry.pending) {
            //
            // There are still pending requests for this entry.
            // This means that FB has not given a response yet
            //
            entry.actions.push(action);
        } else {
            //
            // The token is in the table, authorize the action immediately.
            //
            action.success();
        }
    } else {
        //
        // No entry in the cache. Add it and kick off an auth check
        // to facebook.
        //
        token_cache.set(key, { pending:true, actions:[action] });
        call_facebook(group, token, token_cache.callback(key));
    }
}

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
// Public exports
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

// A closure for FB auth error failure... send error
// This is used for all the REST calls
function reject(response) {
    return function (msg) {
        dt.senderror(405, msg, response);
    };
}

exports.disable_fb_check = false;

//
// Get goup data: retrieve data from the group DB
//

// Success closure... send file
function respond_get_group_data(fname, response) {
    return function () {
        dt.sendfile(fname, response);
    };
}

// The handler
exports.get_group_data = function(request, response)
{
        var group = request.params.group;
        var token = request.params.access_token;
        var srcid = request.params.srcid;
        var fname = './d/' + group + '/' + srcid + '/' + request.params.resource + '.json'; 
        var callback = { success:respond_get_group_data(fname, response),
             fail:reject(response) };
        fb_check_access(group, token, callback);
};

//
// Facebook info
//
exports.get_fb_info = function(request, response) {
    var config = require('./config');
    var fb = config.facebook;
    if (fb == undefined) {
        response.writeHead(404);
        response.end();
    } else {
        response.writeHead(200);
        response.end(JSON.stringify(fb), 'utf-8');
    }
};

//
// Sync status
//

// Success closure
function respond_get_src_sync_status(group, srcid, response) {
    return function () {
        srclist.get(group, srcid, function(info) {
            if (info) {
                var retcode;

                //
                // XXX this is temporary, until we have a policy to save passwords to disk
                //
                if(info.pass === '') {
                    response.writeHead(401, { 'Content-Type': 'text/css' });
                    response.end(JSON.stringify({'id':srcid}), 'utf-8');
                    return;
                }

                var res = spm.get_sync_status(group, srcid, response, function(code, body) {
                    response.writeHead(code, { 'Content-Type': 'text/css' });

                    if(body) {
                        body.id = srcid;
                        response.end(JSON.stringify(body), 'utf-8');
                    } else {
                        response.end(JSON.stringify({'id':srcid}), 'utf-8');
                    }
                });
            } else {
                response.writeHead(400, { 'Content-Type': 'text/css' });
                response.end();
            }
        });
    };
}

// The handler
exports.get_src_sync_status = function(request, response)
{
        var group = request.params.group;
        var token = request.params.access_token;
        var id = request.params.srcid;

        var callback = { success:respond_get_src_sync_status(group, id, response),
             fail:reject(response) };
        fb_check_access(group, token, callback);
};

//
// Sync info update.
//

// Success closure... update source data
function respond_sync_src(group, srcid, response, pass) {
    return function () {
        srclist.get(group, srcid, function(info) {
            if (info) {
                info.pass = pass;
                var retcode = spm.sync(group, srcid, info);
                response.writeHead(retcode, { 'Content-Type': 'text/css' });
                response.end();
            } else {
                response.writeHead(400, { 'Content-Type': 'text/css' });
                response.end();
            }
        });
    };
}

// The handler
exports.sync_src = function(request, response)
{
        var group = request.params.group;
        var token = request.params.access_token;
        var id = request.params.srcid;
        var pass = '';
        if (request.params.pass) {
//            srclist.add_pass(group, id, request.params.pass);
            srclist.add_pass(group, id, '********');
            pass = request.params.pass;
        }

        var callback = { success:respond_sync_src(group, id, response, pass),
             fail:reject(response) };
        fb_check_access(group, token, callback);
};

//
// Get the list of sources
//

// Success closure
function respond_get_sources(group, response) {
    return function () {
        srclist.getall(group, function(status, res) {
            if (status == 200) {
                //
                // Add the sources types information. We include this
                // information here to reduce round trips.
                //
                res['source_types'] = spm.get_plugins_info();

                response.writeHead(200, { 'Content-Type': 'text/css' });
                response.end(JSON.stringify(res), 'utf-8');
            } else {
                res = {};
                res['source_types'] = spm.get_plugins_info();
                res['sources'] = [];

                response.writeHead(200, { 'Content-Type': 'text/css' });
                response.end(JSON.stringify(res), 'utf-8');
            }
        });
    };
}

// The handler
exports.get_sources = function(request, response)
{
        var group = request.params.group;
        var token = request.params.access_token;

        var callback = { success:respond_get_sources(group, response),
             fail:reject(response) };
        fb_check_access(group, token, callback);
};

//
// Add a new source
//

// Success closure
function respond_add_source(group, params, response) {
    return function () {
        srclist.add(group, params, function(status, id) {
            if (status == 200) {
                response.writeHead(200, { 'Content-Type': 'text/css' });
                response.end(JSON.stringify({'id':id}), 'utf-8');
            } else {
                response.writeHead(status, { 'Content-Type': 'text/css' });
                response.end();                
            }
        });
    };
}

// The handler
exports.add_source = function(request, response)
{
        var group = request.params.group;
        var token = request.params.access_token;
        
        var params = {};
        for (var k in request.params) {
            if(k != 'access_token' &&
              k != 'apiversion' &&
              k != 'group') {
                params[k] = request.params[k];
            }
        }

        var callback = { success:respond_add_source(group, params, response),
             fail:reject(response) };
        fb_check_access(group, token, callback);
};

//
// Remove a source
//

// Success closure
function respond_remove_source(group, srcid, response) {
    return function () {
        srclist.remove(group, srcid, function(status) {
            response.writeHead(status, { 'Content-Type': 'text/css' });
            response.end();                
        });
    };
}

// The handler
exports.remove_source = function(request, response)
{
        var group = request.params.group;
        var token = request.params.access_token;
        var id = request.params.srcid;

        var callback = { success:respond_remove_source(group, id, response),
             fail:reject(response) };
        fb_check_access(group, token, callback);
};
