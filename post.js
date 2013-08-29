var upload = require('./lib/upload');
var needle = require('needle');

var data = 'data={"patient":{"first_name":"Ian","last_name":"Jorgensen","summary":"hello post","id":"635639972","email":"jorgensen.ian@gmail.com","picture":"https://graph.facebook.com/635639972/picture","birth":{"month":9,"day":13,"year":"1984"},"diagnosis":{"month":7,"day":1,"year":"2007"}}}';

var localApi = {
	host: 'localhost:8082',
	accessToken: 'CAAGHQq80mtcBAPo2a1FdbU8GC8b9ZBnYE0Nw6ZBDNZBJSrw42M3D2ZCqwZBbrWushH2KNhpAFUod8YhZA9Kx3h7AnZCaemqzdBof0GzqIYbCUbew37WZCZBmhaXWUwBcHVwDb5Wp9tdUbCmUX5hGl16wpQcJPQaIDhxLfMsFRZCfttBu9A5oGMiAOxDcaHmBBgkzeKn5a9JWfszgZDZD'
}

var jitApi = {
	host: 'blipapitidepoolorg.jit.su',
	accessToken: 'CAAH5TZCaRCwUBAATmzjrLqvSFjfpBuYEDf3T2x4dunUNbgEQZC4Uchaj9qz91bFJvtu7EaZAAepuHK9n5zs7dljotqvbgic5AL3kssAza3ZBi66BfgV37qZBGR2XTpZAiZCy8JrGxFPxrmptou5IWufcdtKZCzXoftxn05ZBqXwXZArhwCdPkyL77r3SpTj2ZBFZCaS0pHh0BHlmFgZDZD'
}

var api = jitApi;

var joinUrl = 'http://' + api.host + '/v1/user/join?accessToken=' + api.accessToken;

needle.post(joinUrl, data, function(err, resp, body){
  console.log(err, body);
});

var file = './katie1.csv';

upload.medtronic(122912, file, function(err, data) {
	console.log(err, data);
});