var time = require('./time');
var url = require('url');
var querystring = require('querystring');
/*
var fetch = function(id, options, callback) {
	options = {
		limit: options.limit || 100,
		skip: options.skip || 0
	}

	fetch() {

	}
};
*/

// todo missing comment pagination
var normalize = function(feed) {
	var data = feed.data.map(function(entry) {
		return {
			id: entry.id,
			createdTime: {
		    unixTimeUTC: time.toUTC(new Date(entry.created_time)).getTime(),
		    unixTime: time.pstTime(entry.created_time).getTime()
		  },
			from: {
	      name: entry.from.name,
	      id: entry.from.id,
	      picture: 'https://graph.facebook.com/' + entry.from.id + '/picture'
	    },
	    message: entry.message,
	    comments: ((entry.comments || []).data || []).map(function(comment) {
		    return {
		      id: comment.id,
		      from: {
		        name: comment.from.name,
		        id: comment.from.id,
		        picture: 'https://graph.facebook.com/' + comment.from.id + '/picture'
		      },
		      createdTime: {
		      	unixTimeUTC: time.toUTC(new Date(comment.created_time)).getTime(),
		    		unixTime: time.pstTime(comment.created_time).getTime()
		      },
		      message: comment.message
		    }
		  })
		}
	});
	
	var paging = {
		previous: querystring.stringify(url.parse(feed.paging.previous, true).query),
		next: querystring.stringify(url.parse(feed.paging.next, true).query)
	};

	return {
		data: data,
		paging: paging
	};
};

module.exports = {
	normalize: normalize
};