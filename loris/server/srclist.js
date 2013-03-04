// Copyright (c) 2012-2013 GreenDot Diabetes, Inc.; all rights reserved
var fs = require('fs');
var walk = require('walkdir');
var path = require('path');
var spm = require('./src_plugin_manager');

var DONT_SAVE_PASSWORDS = true;
var passwords = {};

//
// XXX
// This will have to disappear when we store passwords properly
//
exports.add_pass = function(group, id, pass) {
    if (!passwords[group]) {
        passwords[group] = {};
    }

    passwords[group][id] = pass;
}

//
// Get the full list of sources
//
exports.getall = function(group, callback) {
    var content;
    var res = {};
    var dirname = './d/' + group;

    res['sources'] = [];

    fs.exists(dirname, function(exists) {
        if (exists) {
            //
            // Scan the subdirectories under this group and find the srcinfo.json files
            // that describe the sources
            //
            var walker  = walk.walk('./d/' + group, { followLinks: false });

            walker.on('file', function(path, stat) {
                if (path.indexOf('srcinfo.json') !== -1) {
                    var pt = path.substring(0, path.lastIndexOf("/"));
                    var id = pt.substring(pt.lastIndexOf("/") + 1);

                    content = fs.readFileSync(path);
                    var js = JSON.parse(content);

                    // Clear the password, so we don't send it back to the client
                    if (js.pass) {
                        js.pass = '';
                    }

                    js.id = id;

                    res.sources.push(js);
                }
            });

            //
            // This is called if there was an error scanning the file system. 
            // Stop here and return an error.
            //
            walker.on("errors", function (path, nodeStatsArray) {                
                callback(400, null);
            });

            //
            // This is called when FS scanning is complete and we're ready
            // to return the results.
            //
            walker.on('end', function() {
                //
                // Sort the sources list by id
                //
                res.sources.sort(function(a, b) {
                    return a.id - b.id;
                })

                callback(200, res);
            });
        } else {
            res = {};
            res['sources'] = [];
            callback(200, res);
        }
    });
};

//
// Add a new source
//
exports.add = function(group, params, callback) {
    var k;

    var list = this.getall(group, function (status, res) {
        if (status == 200) {
            //
            // Get the information for the plugin related to this source
            //
            var pinfo = spm.get_plugins_info()[params.type];

            //
            // Determine the ID to be used
            //
            var newid;

            if (res.sources && (res.sources.length !== 0)) {
                var newnum = +res.sources[res.sources.length - 1].id + 1;
                var s = "0000" + newnum;
                var newid = s.substr(s.length - 4);
            } else {
                newid = '0001';
            }

            //
            // If there is no description from the user, use the one from 
            // the source type
            //
            if (!params.ui_desc || params.ui_desc == '') {
                params.ui_desc = pinfo.desc;
            }

            //
            // If DONT_SAVE_PASSWORDS is specified, passwords don't go to disk,
            // But we at least save a volatile copy in memory.
            //
            if (DONT_SAVE_PASSWORDS) {
                for (var k in params) {
                    for (j = 0; j < pinfo.params.length; j++) {
                        if (pinfo.params[j].id === k) {
                            if (pinfo.params[j].type === 'PasswordString') {
                                exports.add_pass(group, newid, params[k]);
                                params[k] = '';
                            }
                        }
                    }
                }
            }

            //
            // Add the source
            //
            var newdata = params;
            newdata.id = newid;
            var dirname = './d/' + group + '/' + newid;

            try {
                try {
                    fs.mkdirSync('./d/' + group);
                }
                catch (e) { 
                    //
                    // Ignore this, we'll catch the error at the next mkdir
                    //
                }
                fs.mkdirSync(dirname);
                fs.writeFileSync(dirname + '/srcinfo.json', JSON.stringify(newdata));
            } 
            catch (e) {
                callback(400, null);
                return;
            }

            callback(200, newid);
        } else {
            callback(status, null);
        }
    });
};

//
// Remove a source from the list given its index
//
exports.remove = function(group, id, callback) {
    var dirname = './d/' + group + '/' + id;

    var walker  = walk.walk(dirname, { followLinks: false });

    //
    // Delete all the files in the source directory
    //
    walker.on('file', function(path, stat) {
        try {
            fs.unlinkSync(path);
        }
        catch (e) {
            //
            // Do nothing. If deletion of any of the files fails, we'll get an
            // error when we call rmdirSync() 
            //
        }
    });

    walker.on('end', function() {
        //
        // All files should be gone. We can delete the directory.
        //
        try {
            fs.rmdirSync(dirname);
        }
        catch (e) {
            callback(400);
            return;
        }

        callback(200);
    });
};

//
// Get a single item from the list
//
exports.get = function(group, id, callback) {
    var res;
    var filename = './d/' + group + '/' + id + '/srcinfo.json';

    try {
        content = fs.readFileSync(filename);        
        res = JSON.parse(content);

        //
        // If DONT_SAVE_PASSWORDS is set, there's a chance that the paswword
        // might be saved in memory.
        //
        if (DONT_SAVE_PASSWORDS) {
            if (res.pass === '') {
                if (passwords[group]) {
                    if (passwords[group][id]) {
                        res.pass = passwords[group][id];
                    }
                }
            }            
        }
    }
    catch (e) {
        res = null;
    }

    callback(res);
}
