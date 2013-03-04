//
// Copyright (c) 2012-2013 GreenDot Diabetes, Inc.; all rights reserved
//
var http = require('http');
var https = require('https');
var fs = require('fs');

var mt = {};
mt['css'] = 'text/css';
mt['js'] = 'application/x-javascript';
mt['jpg'] = 'image/jpeg';
mt['jpeg'] = 'image/jpeg';
mt['png'] = 'image/png';
mt['ico'] = 'image/x-icon';

function file_ext(filename) {
    return filename.split('.').pop();
}

exports.sendfile = function(filename, response) { 
    console.log('loading from fs: ' + filename);
    
    fs.exists(filename, function(exists) {
        if (exists) {
            console.log('reading: ' + filename);
            var ext = file_ext(filename);       
            var mime_type = mt[ext];
            if (mime_type == undefined)
                mime_type = 'text/html';

            fs.readFile(filename, function(error, content) {
                if (error) {
                    console.log('error reading ' + filename);
                    response.writeHead(500);
                    response.end();
                }
                else {
                    response.writeHead(200, { 'Content-Type': mime_type });
                    response.end(content, 'utf-8');
                }
            });
        }
        else {
            console.log(filename + ' not found');
            response.writeHead(404);
            response.end();
        }
    });
}

exports.senderror = function(code, string, response) {
    console.log(string);
    response.writeHead(code);
    response.end();
}
