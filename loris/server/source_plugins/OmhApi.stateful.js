/*
 *  Copyright 2012 John Jenkins
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */
/**
 * <p>This class is the Open mHealth API interface for JavaScript.</p>
 * 
 * <p>This library uses session storage to manage authentication information.
 * Once a user has authenticated on any page, any other function may be safely
 * called. All methods take a callback parameter, which should have a field
 * called "authFailure" that is a function with no parameters; if the 
 * authentication information is no longer present or the token has expired,
 * this function will be called.</p>
 * 
 * <p>Note: This library requires jQuery.</p>
 * 
 * @author John Jenkins
 */

/**
 * Creates a new OmH object that points to the parameterized server.
 * 
 * @param uri The URI to the root of the Open mHealth APIs, e.g.
 *            "https://localhost:8080/app/omh/v1.0/".
 * 
 * @param requester The requester that is required 
 */
function OmH(uri, requester) {
	'use strict';

	(function (omh) {
		// The JavaScript types.
		var JS_TYPE_BOOLEAN = "[object Boolean]"
		  , JS_TYPE_NUMBER = "[object Number]"
		  , JS_TYPE_STRING = "[object String]"
		  , JS_TYPE_OBJECT = "[object Object]"
		  , JS_TYPE_ARRAY = "[object Array]"
		  , JS_TYPE_DATE = "[object Date]"
		  , JS_TYPE_NULL = "[object Null]"
		  , JS_TYPE_UNDEFINED = "[object Undefined]";
		
		// Validate the URI.
		var uriType = Object.prototype.toString.call(uri);
		if(uriType === JS_TYPE_UNDEFINED) {
			throw "The URI for the /omh/v1.0 endpoint must be given.";
		}
		else if(uriType !== JS_TYPE_STRING) {
			throw "The URI must be a string.";
		}
		
		// Build all of the URIs.
		omh.uri = {};
		if(uri[uri.length - 1] !== '/') {
			omh.uri.root = uri + '/';
		}
		else {
			omh.uri.root = uri;
		}
		omh.uri.authentication = omh.uri.root + "authenticate";
		omh.uri.read = omh.uri.root + "read";
		
		// Validate the requester and set it.
		var requesterType = Object.prototype.toString.call(requester);
		if(requesterType === JS_TYPE_UNDEFINED) {
			throw "A requester value is required.";
		}
		else if(requesterType !== JS_TYPE_STRING) {
			throw "The requester must be a string.";
		}
		else {
			omh.requester = requester;
		}
		
		/**
		 * The default authentication object. This will be used when no 
		 * concrete object is available.
		 */
		var DEFAULT_AUTH = { auth_token : "", expires : new Date(0) };
		/**
		 * The local authentication object.
		 */
		omh.auth = null;
		
		/**
		 * <p>Sets the authentication object. This may be an object with the
		 * following fields or a string representing that object.</p>
		 * <table>
		 * 	<tr><td>Key</td><td>Value</td></tr>
		 * 	<tr>
		 * 		<td>auth_token</td>
		 * 		<td>The current authentication token for the user.</td>
		 * 	</tr>
		 * 	<tr>
		 * 		<td>expires</td>
		 * 		<td>A string or Date object representing when the token
		 * 			expires.</td>
		 * 	</tr>
		 * </table>
		 * <p>The parameter may also be missing or null, which indicates that
		 * it should reset the value.</p>
		 * 
		 * @param obj The authentication information as either an object or a
		 * 			  string.
		 */
		function setAuthentication(obj) {
			// If no parameter is given or if it is null, reset the 
			// authentication information.
			var authObject
			  , objType = Object.prototype.toString.call(obj)
			  , tokenType
			  , expiresType;
			
			// If the parameter is a string, attempt to convert it to an
			// object.
			if(objType === JS_TYPE_STRING) {
				authObject = JSON.parse(obj);
			}
			// If the parameter is an object, attempt to convert it to an
			// object.
			else if(objType === JS_TYPE_OBJECT) {
				authObject = obj;
			}
			// If the parameter is missing or null, we are resetting the 
			// object.
			else if(
				(objType === JS_TYPE_NULL) || 
				(objType === JS_TYPE_UNDEFINED)) {
				
				authObject = DEFAULT_AUTH;
			}
			// Otherwise, we don't understand and are going to error out.
			else {
				throw "The object's type is not valid for an authentication object: " + objType;
			}
			
			// Ensure that there is an auth_token field.
			tokenType = Object.prototype.toString.call(authObject.auth_token);
			if(tokenType === JS_TYPE_UNDEFINED) {
				throw "The authentication object doesn't contain a token.";
			}
			// Ensure that the token is not null.
			else if(tokenType === JS_TYPE_NULL) {
				throw "The token is null."
			}
			// And that it is a string.
			else if(tokenType !== JS_TYPE_STRING) {
				throw "The authentication token must be a string.";
			}
				
			// Ensure that there is an expires field.
			expiresType = Object.prototype.toString.call(authObject.expires);
			if(expiresType === JS_TYPE_UNDEFINED) {
				throw "The authentication object doesn't contain an expiration date.";
			}
			// Ensure that the expires field is not null.
			else if(expiresType === JS_TYPE_NULL) {
				throw "The expires field is null.";
			}
			// If the expires field is a string, decode it into a date.
			else if(expiresType === JS_TYPE_STRING) {
				authObject.expires = new Date(authObject.expires);
			}
			// If the expires field wasn't a string, ensure that it is a Date.
			else if(expiresType !== JS_TYPE_DATE) {
				throw "The expires field was not a string or Date object.";
			}
			
			// Always save it as our state variable.
			omh.auth = authObject;
			
			// Check if we have session storage.
			if(typeof(Storage) !== "undefined") {
				// If so, backup the auth object into the session's storage.
				sessionStorage
					.setItem(
						"omh." + omh.uri.root + ".auth",
						JSON.stringify(omh.auth));
			}
		}
		
		/**
		 * Retrieves the authentication information. If the user has not yet
		 * been authenticated, the token will be null and the expiration date
		 * will be in the past.
		 * 
		 * @returns The authentication information as a JSON object.
		 */
		function getAuthentication() {
			// If we don't have it decoded locally,
			if(omh.auth === null) {
				// If we have it stored in the current session,
				if(typeof(Storage) !== "undefined") {
					// Attempt to get the authentication object.
					var auth =
						sessionStorage
							.getItem("omh." + omh.uri.root + ".auth");

					// If the authentication was located in the storage.
					if(auth !== null) {
						setAuthentication(auth);
					}
				}
				
				// If it wasn't in the storage, reset it.
				if(omh.auth === null) {
					setAuthentication();
				}
			}
			
			return omh.auth;
		}
		
		/**
		 * Authenticates a user with the given username and password. If
		 * successful, the credentials will be stored in the session's storage.
		 * 
		 * @param username The user's username.
		 * 
		 * @param password The user's password.
		 * 
		 * @param callback The function to be called once the authentication
		 * 				   call has completed. It should be an object with two
		 * 				   fields, "success" and "failure", which should be
		 * 				   functions.
		 */
		function authenticate(username, password, callback) {
			// Validate the username.
			var usernameType = Object.prototype.toString.call(username);
			if(	(usernameType === JS_TYPE_UNDEFINED) ||
				(usernameType === JS_TYPE_NULL)) {
				
				throw "A username must be given.";
			}
			
			// Validate the password.
			var passwordType = Object.prototype.toString.call(password);
			if(	(passwordType === JS_TYPE_UNDEFINED) ||
				(passwordType === JS_TYPE_NULL)) {
				
				throw "A password must be given.";
			}
			
			// Create the parameters.
			var parameters = {};
			parameters.user = username;
			parameters.password = password;
			parameters.requester = omh.requester;

			// Make the request.
			$.post(
				omh.uri.authentication,
				parameters,
				function(data) {
					// Save the data.
					try {
						setAuthentication(data);
		            } 
		            catch (e) {
						callback.failure(e);
						return;
		            }

					// If the user supplied a "success" function, call it.
					if(callback && callback.success) {
						callback.success();
					}
				},
				"json")
			.error(function(response) {
				// If the user supplied a "failure" function, call it.
				if(callback && callback.failure) {
					callback.failure(response);
				}
			});
		}
		
		/**
		 * Calls the read API and sends the data exactly as it is returned from
		 * the request as the only parameter to the callback's success 
		 * function. If the callback is null or it doesn't have a field named
		 * "success" that is a function, then this call will be relatively 
		 * useless. It will still make the call, but the results will be lost.
		 * 
		 * @param payloadId Required. A string value representing the payload
		 * 					ID that dictates what data should be returned.
		 * 
		 * @param payloadVersion Required. A number representing the version of
		 * 						 the payload to read.
		 * 
		 * @param callback Optional but suggested. This object should have at
		 * 				   least one field, "success", that is a function that
		 * 				   takes one parameter. This function will be called
		 * 				   when the data is returned. Optionally, there can 
		 * 				   also be a single-argument function called "failure"
		 * 				   that will be called if the request fails and whose
		 * 				   parameter is a jQuery jqXHR object. Optionally,
		 * 				   there can be a no-argument function called 
		 * 				   "authFailure" that will be called if there is no
		 * 				   acceptable authentication token.
		 * 
		 * @param owner Optional. A string value username of the user about 
		 * 				whom the data should apply.
		 * 
		 * @param tStart Optional. A JavaScript Date object or a string 
		 * 				 representing the earliest time at which data should be
		 * 				 retrieved for a user.
		 * 
		 * @param tEnd Optional. A JavaScript Date object or a string 
		 * 			   representing the latest time at which data should be 
		 * 			   retrieved for a user.
		 * 
		 * @param columnList Optional. A string of comma-separated column 
		 * 					 names.
		 * 
		 * @param numToSkip Optional. A number representing the number of  
		 * 					results to skip.
		 * 
		 * @param numToReturn Optional. A number representing the number of
		 * 					  results to return after skipping.
		 */ 
		function read(
			payloadId,
			payloadVersion,
			callback,
			owner, 
			tStart, 
			tEnd, 
			columnList, 
			summarize, 
			numToSkip, 
			numToReturn) {
			
			// Create the object that will store all of the parameters.
			var parameters = {};
			
			// Add the authentication token.
			var auth = getAuthentication();
			if((new Date()).getTime() > auth.expires.getTime()) {
				if(callback && callback.authFailure) {
					callback.authFailure();
				}
				else {
					throw "The authentication token has expired.";
				}
				return;
			}
			parameters.auth_token = getAuthentication().auth_token;
			
			// Add the requester value.
			parameters.requester = omh.requester;
			
			// Add the payload ID.
			var payloadIdType = Object.prototype.toString.call(payloadId);
			if(payloadIdType === JS_TYPE_UNDEFINED) {
				throw "A payload ID must be given.";
			}
			else if(payloadIdType === JS_TYPE_NULL) {
				throw "The payload ID cannot be null.";
			}
			else {
				parameters.payload_id = payloadId;
			}
			
			// Add the payload version.
			var payloadVersionType = 
				Object.prototype.toString.call(payloadVersion);
			if(payloadVersionType === JS_TYPE_UNDEFINED) {
				throw "A payload version must be given.";
			}
			else if(payloadVersionType === JS_TYPE_NULL) {
				throw "The payload version cannot be null.";
			}
			else {
				parameters.payload_version = payloadVersion;
			}
			
			// If the owner parameter is given, add it to the request.
			if(owner !== null) {
				parameters.owner = owner;
			}

			// If the start date parameter is given, add it to the request.
			if(tStart !== null) {
				parameters.t_start = tStart;
			}

			// If the end date parameter is given, add it to the request.
			if(tEnd !== null) {
				parameters.t_end = tEnd;
			}

			// If the column list parameter is given, add it to the request.
			if(columnList !== null) {
				parameters.column_list = columnList;
			}

			// If the summarize parameter is given, add it to the request.
			if(summarize !== null) {
				parameters.summarize = summarize;
			}

			// If the number of responses to skip parameter is given, add it to
			// the request.
			if(numToSkip !== null) {
				parameters.num_to_skip = numToSkip;
			}

			// If the number of responses to return parameter is given, add it
			// to the request.
			if(numToReturn !== null) {
				parameters.num_to_return = numToReturn;
			}
			
			// Make the request.
			$.post(
				omh.uri.read,
				parameters,
				function(data) {
					// Call the callback's success function with the data.
					if(callback && callback.success) {
						callback.success(data);
					}
				},
				"json")
			.error(function(response) {
				// If the user supplied a "failure" function, call it.
				if(callback && callback.failure) {
					callback.failure(response);
				}
			});
		}
		
		/**
		 * Logs the user out of the system by resetting their authentication
		 * information both in this object and in the session.
		 */
		function logout() {
			setAuthentication();
		}
		
		// Assign the functions to the object.
		omh.authenticate = authenticate;
		omh.read = read;
		omh.logout = logout;
		
	}(this));
}

// heuristic to see if we're running in node...
if (typeof window == 'undefined' && typeof exports != 'undefined') {
    var https = require('https');
    var url = require('url');
    var qs = require('querystring');
    $ = {};
    $.post = function(uri, params, callback, ignore) {
	var query = qs.stringify(params);
	var u = url.parse(uri);
	var options = {
	    method:'POST',
	    port:443,
	    host:u.host,
	    path:u.path,
	    headers: {
		'Content-Type': 'application/x-www-form-urlencoded',
		'Content-Length': query.length
	    }
	};
	var req = https.request(options, function(res) {
		var result = '';
		res.on('data', function(resp) {
			result += resp;
		    });
		res.on('end', function() {
			callback(result);
		    });

		//res.error or something... tie to error below
	    });
	req.write(query);
	req.end();
	return { error:function(f) { /* FIX */ } }
    };
    exports.init = function(uri, requester) {
	return new OmH(uri, requester);
    };
}
