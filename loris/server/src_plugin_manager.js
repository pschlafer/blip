//
// Copyright (c) 2012-2013 GreenDot Diabetes, Inc.; all rights reserved
//

var fs = require('fs');
var dt = require('./datatransfer.js');
var updater = require('./updater');
var walk = require('walkdir');

var plugins = [];
var pending_fetches = {};


///////////////////////////////////////////////////////////////////////////////
// Plugins management
///////////////////////////////////////////////////////////////////////////////

//
// Scan the plugin list
//
function load_plugins() {
    var dirname = 'source_plugins';

    walk.sync('source_plugins',function(path, stat){
        if (path.indexOf(".js") !== -1) {
            var plugin = require(path);
            var pi;

            //
            // Only modules that export the get_plugin_info() are plugins
            //
            try {
                pi = plugin.get_plugin_info();
            }
            catch (e) {
                return;
            }

            console.log('loading plugin %s (%s)', pi.name, path);
            plugins.push(plugin);
        }
    });
}

function get_plugin(type) {
    for (k = 0; k < plugins.length; k++) {
        var pi = plugins[k].get_plugin_info();
        
        if (pi.name === type) {
            return plugins[k];
        }
    }

    return null;
}

//
// Return plugin info
//
exports.get_plugins_info = function() {
    var k;
    var res = {};

    for (k = 0; k < plugins.length; k++) {
        var pi = plugins[k].get_plugin_info();
        pi.iconfile = '/srcimg/' + pi.iconfile;
        pi.params.push({
            'id': 'ui_desc',
            'name': 'Optional Description',
            'description': 'A short name that the website UI will show for this source',
            'required': false,
            'type': 'ShortString'
          });

        res[pi.name] = pi;
    }

    return res;
}

///////////////////////////////////////////////////////////////////////////////
// Fetching infrastructure
///////////////////////////////////////////////////////////////////////////////

function write_fetch_result(group_id, srcid, resp, callback) {
    var path = './d/' + group_id + '/' + srcid;
    var fname = path + '/pump-fetch_result.json';
    var filecontent = { success:resp.success, 
        last_fetch_time:(new Date()).getTime(),
        error_str: 'pump update error'};   // XXX This should be populated with something meaningful once the python script returns it

    //
    // Note: if there's an error, we just ignore it.
    // In case of error, the file won't be written (or will be empty) 
    // and we'll return a generic error at the REST layer
    //
    fs.writeFile(fname, JSON.stringify(filecontent), 'utf8', function(err) {
        callback();
    });
}

//
// Fetch the pump data.
// Returns an http status code indicating the result of the operation
// Expected results are 200 for success or 409, meaning that another
// request is in progress
//
exports.sync = function(group_id, srcid, srcinfo) {

    var plugin = get_plugin(srcinfo.type);
    var pinfo = plugin.get_plugin_info();

    //
    // Block successive fetch requests for this group until we're done
    //
    if (!pending_fetches[group_id]) {
        pending_fetches[group_id] = {};
    }

    if (pending_fetches[group_id][srcid]) {
        return 409;
    } else {
        pending_fetches[group_id][srcid] = (new Date()).getTime();
    }

    //
    // Fire the fetch
    //
    plugin.fetch(srcinfo,
        function(resp) {
            //
            // if suscessful, then the result is a set of arrays
            // where each array is a the time series data and
            // the key (name) of the array is the data set it
            // represents
            //
            if (resp.success) {
                write_fetch_result(group_id, srcid, resp, function() {
                    //
                    // Write the sets to disk
                    //
                    var named_sets = resp['result'];
                    updater.integrate(pinfo.data_prefix, group_id, srcid, named_sets);

                    //
                    // We're done, remove this group from the pending list
                    //
                    delete pending_fetches[group_id][srcid];
                });
            } else {
                write_fetch_result(group_id, srcid, resp, function() {
                    //
                    // We're done, remove this group from the pending list
                    //
                    delete pending_fetches[group_id][srcid];
                });
            }
        });

    return 200;
};

//
// Get the result of the last fetch operation.
// Returns an object with the HTTP status and the body for the response to the user
//
exports.get_sync_status = function(group_id, srcid, response, callback) {
    if (!pending_fetches[group_id]) {
        pending_fetches[group_id] = {};
    }

    if (pending_fetches[group_id][srcid]) {
        //
        // The pump for this group is currently fetching
        //
        callback(409, null);
    } else {
        var path = './d/' + group_id + '/' + srcid;
        var fname = path + '/pump-fetch_result.json';

        fs.readFile(fname, function(error, content) {
            if (error) {
                //
                // Can't read the file
                //
                callback(404, null);
            }
            else {
                //
                // The file is there, parse it and check the result of the last fetch.
                // NOTE: the fetcher stores the result in the json file, while the REST
                // API exposes it in the status code. Therefore, we create a new object
                // without it. This object will be converted to json and sent to the browser.
                //
                var jcont = JSON.parse(content);
                var body = {last_fetch_time: jcont.last_fetch_time,
                    error_str: jcont.error_str};

                if (jcont.success) {
                    callback(200, body);
                } else {
                    callback(401, body);
                }
            }
        });
    }
}

///////////////////////////////////////////////////////////////////////////////
// MODULE INITIALIZATION
// scan for plugins in the source_plugins directory
///////////////////////////////////////////////////////////////////////////////
load_plugins();
