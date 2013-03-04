// Copyright (c) 2012 GreenDot Diabetes, Inc.; all rights reserved

//
// Source list class
//
var srclist = {};

//
// Device type enumeration
//
var source_type = null;
var n_source_types = 0;

//
// Get the full list of sources
//
srclist.getall = function() {
    //
    // Create the request URL
    //
    var group = fb.get_selected_group();
    var response_data = null;
    var error = false;

    //
    // Send the request to the server
    //
    var prefix = '/api/' + api_v_str + '/groups/' + group.id;
    url = prefixify(prefix, ['sources'], [], true)[0];

    $.ajax({
        type : 'GET',
        url : url,
        dataType : 'json',
        success : function(json, e) {
            response_data = json;
        },
        error : function(jqxhr) {
            error = true;
        },
        data : {},
        async : false
    });

    if (error) {
        return [];
    }

    //
    // Store the source types enumeration
    //
    source_type = response_data.source_types;

    //
    // While we're here, count the source types, so we don't have to count it
    // multiple times later on.
    //
    n_source_types = 0;
    for (var s in source_type) {
        if (source_type.hasOwnProperty(s)) {
           ++n_source_types;
        }
    }

    return response_data.sources;
};

//
// Add a new source
//
srclist.add = function(type, params) {
    //
    // Create the request
    //
    var group = fb.get_selected_group();

    var request_data = params;
    request_data.type = type;

    var response_data = null;
    var error = false;

    //
    // Send the request to the server
    //
    var prefix = '/api/' + api_v_str + '/groups/' + group.id;
    url = prefixify(prefix, ['sources'], [], true)[0];

    $.ajax({
        type : 'POST',
        url : url,
        dataType : 'json',
        success : function(json, e) {
            response_data = json;
        },
        error : function(jqxhr) {
            error = true;
        },
        data : request_data,
        async : false
    });

    if (error) {
        return null;
    }

    return response_data.id;
};

//
// Remove a source from the list given its index
//
srclist.remove = function(id) {
    //
    // Create the request
    //
    var group = fb.get_selected_group();

    var request_data = null;
    var response_data = null;
    var error = false;

    //
    // Send the request to the server
    //
    var prefix = '/api/' + api_v_str + '/groups/' + group.id;
    url = prefixify(prefix, ['sources/' + id], [], true)[0];

    $.ajax({
        type : 'DELETE',
        url : url,
        dataType : 'json',
        success : function(json, e) {
            response_data = json;
        },
        error : function(jqxhr) {
            error = true;
        },
        data : request_data,
        async : false
    });

    if (error) {
        return false;
    }

    return true;
};

//
// Get a specific item
//
srclist.get = function(id) {
    var list = this.getall();

    for(var k = 0; k < list.length; k++) {
        if (list[k].id == id) {
            return list[k];
        }
    }

    return null;
};

//
// Update an existing item with info coming from the client
//
srclist.update = function(index, params) {
    var list = this.getall();
    var tdesc;

    if (desc) {
        tdesc = desc;
    } else {
        tdesc = source_type[list[index].type].desc;
    }

    list[index].user = user;
    list[index].pass = pass;
    list[index].desc = tdesc;

    localStorage.setItem('blipstate-' + fb.me.id, JSON.stringify(list));
};
