//
// Copyright (c) 2012 GreenDot Diabetes, Inc.; all rights reserved
//

//
// This is the variablr associated with the periodic status check function in
// the pump sync page 
//
var src_interval_timer = null;
var spinner = null;
var sync_in_progress = false;   // NOTE: I spent two hours trying to figure out how to
                                // turn off click events from disabled buttons with 
                                // jquery and didn't find any freakin way that works.
                                // As a consequence, I'm using an ugly global variable.

function show_spinner() {
    var k;
    var url;

    //
    // Show the spinner
    //
    var target = $('#sync-pump-div').get(0);

    if (!spinner) {
        var spinner_opts = {
          lines: 13, // The number of lines to draw
          length: 5, // The length of each line
          width: 4, // The line thickness
          radius: 10, // The radius of the inner circle
          corners: 1, // Corner roundness (0..1)
          rotate: 0, // The rotation offset
          color: '#000', // #rgb or #rrggbb
          speed: 1, // Rounds per second
          trail: 60, // Afterglow percentage
          shadow: false, // Whether to render a shadow
          hwaccel: false, // Whether to use hardware acceleration
          className: 'spinner', // The CSS class to assign to the spinner
          zIndex: 2e9, // The z-index (defaults to 2000000000)
          top: 10, // Top position relative to parent in px
          left: 'auto' // Left position relative to parent in px
        };

        spinner = new Spinner(spinner_opts).spin(target);
    } else {
        spinner.spin(target);
    }

    //
    // Disable the button
    //
    sync_in_progress = true;
    $("#sync-pump-button").attr('class', 'btn btn-large btn-success disabled');
    $("#sync-settings-button").attr('class',
                    'btn btn-large btn-primary disabled');
}

function hide_spinner() {
    var k;
    var url;

    //
    // Hide the spinner
    //
    if (spinner) {
        spinner.stop();        
    }

    //
    // Enable the button
    //
    sync_in_progress = false;
    $("#sync-pump-button").attr('class', 'btn btn-large btn-success');
    $("#sync-settings-button").attr('class', 'btn btn-large btn-primary');
}

function src_success_cb(json, e) {
    var d = new Date();
    d.setTime(json.last_fetch_time);

    $('#sync-status-text').text(" Success").attr('class', ' icon-ok-sign').attr('style', 'color: green;');
    $('#sync-time-text').text(d);
    hide_spinner();

    set_fb_group(fb.get_selected_group().name, 
            'The new data for this device has been succesfully downloaded and is now included in the dashboard.',
            'Success!',
            'alert alert-success');
}

function sync_modal_dismiss() {
    //
    // Rebuild the home page with an error notification bar
    //
    set_fb_group(fb.get_selected_group().name,
        'The data for the device has not been updated.',
        'Sync Canceled',
        'alert alert-error');
}

//
// XXX this is temporary and will go away when we store passwords server-side
//
function ask_pw_modal(type, id) {
    var page = $('#spa_root').get(0);
    var b = $.el;

    //
    // Make sure previously created modals are destroyed
    //
    $("#device-modal").remove();

    b.div({'id':'device-modal', 'class':'modal hide fade', tabindex:'-1', role:'dialog', 'aria-labelledby':'myModalLabel', 'aria-hidden':'true'},
        b.div({'class':'modal-header'},
            b.button({type:'button', 'class':'close', 'data-dismiss':'modal'}, '×'),
            b.h3('Password Required')
        ),
        b.div({'class':'modal-body'},
            b.form(
                b.p(
                    b.input({'id':'sync-params-pass', style:'width:50%', type:'password', placeholder:'Password'})
                )
            ),
            b.p({'id':'newdevice-error-text', 'style':'color:red;'})
        ),
        b.div({'class':'modal-footer'},
            b.button({'class':'btn', 'data-dismiss':'modal', onclick:'sync_modal_dismiss()', 'aria-hidden':'true'}, 'Cancel'),
            b.button({'class':'btn btn-primary', onclick:'create_sync_page("' + id + '")'}, 'Sync')
        )
    )
    .appendTo(page);
}

function src_failure_pw(jqxhr) {
//    pass = $('#sync-params-pass').get(0);
    pass = null;

    if (!pass) {
        $('#device-modal').modal('hide');
        clearInterval(src_interval_timer);
        hide_spinner();
        var data = JSON.parse(jqxhr.responseText);         
        ask_pw_modal(data.type, data.id);
        $('#device-modal').data('id', data.id);
        $('#device-modal').modal();            
    }
}

function src_failure_cb(jqxhr) {
    if (jqxhr.status === 409) {
        $('#sync-status-text').text(" In progress").attr('class', ' icon-circle-arrow-down').attr('style', 'color: #F88017;');
        $('#sync-time-text').text("n.a.");
        show_spinner();
    } else if (jqxhr.status === 400) {
        var json = $.parseJSON(jqxhr.responseText);
        var d = new Date();
        d.setTime(json.last_fetch_time);

        $('#sync-status-text').text(" sync failed, check your password").attr('class', ' icon-exclamation-sign').attr('style', 'color: #C11B17;');
        $('#sync-time-text').text(d);
        hide_spinner();
        src_failure_pw(jqxhr);

    } else if (jqxhr.status === 404) {
        $('#sync-status-text').text(" pump not synced yet").attr('class', ' icon-exclamation-sign').attr('style', 'color: #C11B17;');
        $('#sync-time-text').text("n.a.");
        hide_spinner();            
    } else if (jqxhr.status === 401) {
        src_failure_pw(jqxhr);
    } else {
        $('#sync-status-text').text(" No connection to blip").attr('class', ' icon-exclamation-sign').attr('style', 'color: #C11B17;');
        $('#sync-time-text').text("n.a.");
        hide_spinner();
    }
}

function poll_src_sync_status(device) {
    //
    // Create the request URL
    //
    var group = fb.get_selected_group();

    //
    // Send the request to the server
    //
    var prefix = '/api/' + api_v_str + '/groups/' + group.id + '/sources/' + device.id;
    url = prefixify(prefix, ['sync'], [], true)[0];

    url += ('&user=' + device.user + '&pass=' + device.pass);

    $.ajax({
        type : 'GET',
        url : url,
        dataType : 'json',
        success : src_success_cb,
        error : src_failure_cb,
        data : {},
        async : true
    });
}

function do_src_sync(device) {
    var k;
    var url;
    var id = device.id;

    if (sync_in_progress) {
        return;
    }

    //
    // Show the spinning wheel
    //
    $('#sync-status-text').text(" In progress").attr('class', ' icon-circle-arrow-down').attr('style', 'color: #F88017;');
    $('#sync-time-text').text("n.a.");

    show_spinner();

    //
    // Create the request URL
    //
    var group = fb.get_selected_group();

    var prefix = '/api/' + api_v_str + '/groups/' + group.id + '/sources/' + id;
    url = prefixify(prefix, ['sync'], [], false)[0];

    var body = create_rest_body();

    if ($('#sync-params-pass').length !== 0 && $('#sync-params-pass').get(0).value !== '') {
        body.pass = $('#sync-params-pass').get(0).value;
        $('#sync-params-pass').get(0).value = '';
    }
    else if ($('#src-params-pass').length !== 0 && $('#src-params-pass').get(0).value !== '') {
        body.pass = $('#src-params-pass').get(0).value;
        $('#src-params-pass').get(0).value = '';
    }

    //
    // Send the request to the server
    //
    $.ajax({
      type : 'POST',
      url : url,
      dataType : 'json',
      error : function(jqxhr) {
        if (jqxhr.status !== 409) {
            // 409 just means that a request is in progress and the periodic 
            // function will pick it up
            clearInterval(src_interval_timer);
            $('#sync-status-text').text(" Connection error. Please reload the page.").attr('class', ' icon-exclamation-sign').attr('style', 'color: #C11B17;');
            $('#sync-time-text').text("n.a.");
            hide_spinner();            
        }
      },
      data : body,
      async : true
    });
}

//
// Create the sync page for a device, or for all the devices if -1 is specified as the index
//
function create_sync_page(id) {
    var k;
    var devs;
    var title;

    $("#device-modal").modal('hide');


    if (id === '') {
        title = 'Syncing All';
    } else {
        var dev = srclist.get(id);
        devs = [dev];
        title = 'Syncing Data Source';
    }

    //
    // Create the page
    //
    var page = sb_reset();

    //
    // Start the sync right away
    // XXX this syncs only the first device for the moment
    //
    do_src_sync(devs[0]);

    //
    // Render the page
    //
    var b = $.el;

    var ptop = b.div({'class':'well'},
        b.div({'class':'col1', id:'sync-pump-div'},
            b.div({'class':'page-header'},
                b.h2(title)
            )
        )
    );

    for(k = 0; k < devs.length; k++) {
        b.div({'class':'well'},
            b.h4(devs[k].desc),
            b.i(devs[k].website),
            b.b('Last sync time: '),
            b.span({id:'sync-time-text'}, 'n.a.'),
            b.p(b.b('Last sync status: '),
                b.i({id:'sync-status-text', 'class':'icon-circle-arrow-down', style:'color: #F88017;'}, ' In progress')
            )
        ).appendTo(ptop);
    }

    ptop.appendTo(page);

    //
    // Show the spinner until we know the status from the server. 
    //
    show_spinner();

    //
    // Check the status from the server and update the page accordingly
    //
    poll_src_sync_status(devs[0]);

    //
    // Start a periodic call to poll_src_sync_status so we can react to
    // changes in the server.
    //
    src_interval_timer = setInterval(function(){poll_src_sync_status(devs[0])}, 1000);
    active_timers.push(src_interval_timer);
}

//
// Add a new device or app
//
function add_device() {
    var params = {};
    var type = $('#device-modal').data('type');

    for (var k in source_type[type].params) {
        var pr = source_type[type].params[k];

        params[pr.id] = $('#src-params-' + pr.id).get(0).value;

        //
        // Value validation
        //
        if (pr.required) {
            if(params[pr.id] === '') {
                $('#newdevice-error-text').text('Please specify the ' + pr.name + ' parameter');
                return;
            }
        }

        if(pr.type === 'ShortString') {
            if(params[pr.id].length > 10) {
                $('#newdevice-error-text').text('The "' + pr.name + '" parameter cannot be longer than 10 characters');
                return;
            }            
        }
    }

    //
    // Get rid of the modal
    //
    $('#device-modal').modal('hide');

    //
    // Add the device to the device list
    //
    var newid = srclist.add(type, params);

    if (newid !== null) {
        //
        // Rebuild the home page with a success notification bar
        //
        spa_build_home('The new device has been successfully added and its data is being downloaded.',
            'Device Added',
            'alert alert-success');

        create_sync_page(newid);
    } else {
        //
        // Rebuild the home page with an error notification bar
        //
        spa_build_home('Device creation failed.',
            'Failure!',
            'alert alert-error');
    }
}

//
// Show the modal with the properties of a new device, based on the device type
//
function build_device_settings_modal(type, id) {
    var page = $('#spa_root').get(0);
    var b = $.el;
    var tdata = source_type[type];

    //
    // Make sure previously created modals are destroyed
    //
    $("#device-modal").remove();

    //
    // Build the modal
    //
    var il = b.fieldset();

    for (var k in source_type[type].params) {
        var pr = source_type[type].params[k];
        var inputtype;

        if (pr.type === 'PasswordString') {
            inputtype = 'password';
        } else {
            inputtype = 'text';            
        }

        b.p(
            b.input({'id':'src-params-' + pr.id, style:'width:50%', type:inputtype, placeholder:pr.name})
        ).appendTo(il);
    }


    b.div({id:'device-modal', 'class':'modal hide fade', tabindex:'-1', role:'dialog', 'aria-labelledby':'myModalLabel', 'aria-hidden':'true'},
        b.div({'class':'modal-header'},
            b.button({type:'button', 'class':'close', 'data-dismiss':'modal'}, '×'),
            b.h3(tdata.desc + ' Settings')
        ),
        b.div({'class':'modal-body'},
            b.form(
                il
            ),
            b.p({'id':'newdevice-error-text', 'style':'color:red;'})
        ),
        b.div({'class':'modal-footer'},
            b.button({'class':'btn', 'data-dismiss':'modal', 'aria-hidden':'true'}, 'Cancel'),
            b.button({'class':'btn btn-primary', onclick:'add_device()'}, 'Add Device')
        )
    )
    .appendTo(page);
}

//
// Called when the user selected one of the device types in the "add device" page
//
function on_newdevice_selected(type) {
    build_device_settings_modal(type);
    $('#device-modal').data('type', type);
    $('#device-modal').modal();
}

//
// Build the "add device" page
//
function create_add_device_page() {
    //
    // Create the page
    //
    var page = sb_reset();

    //
    // Render the page
    //
    var b = $.el;

    var il = b.tr();

    for (var k in source_type) {
        var s = source_type[k];

        b.td({'width': '' + 100 / n_source_types + '%','style':'text-align:center'},
            b.a({'href':'#', 'onclick':'on_newdevice_selected("' + k + '")'},
                b.img({'src': s.iconfile})
            )
        ).appendTo(il);
    }

    var body =b.div({'class':'well'},
        b.div({'class':'col1', id:'sync-pump-div'},
            b.h2('Add Device/App'),
            b.br(),
            'Which type or app type do you want to add?',
            b.br(),
            b.br(),
            b.div({'class':'well'},
                b.table({'width':'100%'},
                    il
                )
            )                
        )
    );

    body.appendTo(page);
}

function delete_device(id) {
    //
    // Delete the device from the list
    //
    if (srclist.remove(id)) {
        //
        // Rebuild the home page with a success notification bar
        //
        set_fb_group(fb.get_selected_group().name,
            'The device has been successfully removed.',
            'Success!',
            'alert alert-success');
    } else {
        //
        // Rebuild the home page with an error notification bar
        //
        set_fb_group(fb.get_selected_group().name,
            'Device removal failed.',
            'Failure!',
            'alert alert-error');
    }
}
