$(function() {
	$('#loginButton').click(showSelectUserType);
	$('#facebook-groups > li').click(chooseDevice);
  
	$("div#profileImage").dropzone({ 
		url: "/file/post",
		uploadMultiple: false,
		previewTemplate: '<div id="dz-preview-template" class="dz-preview dz-file-preview"><div class="dz-details"><div class="dz-filename"><span data-dz-name></span></div><div class="dz-size" data-dz-size></div><img class="dropImage" data-dz-thumbnail /></div><div class="dz-progress"><span class="dz-upload" data-dz-uploadprogress></span></div></div>',
		init: function() {
    	this.on("addedfile", function(file) {
    		var images = $('.dz-preview');

    		$('#dropin-pic').remove();

    		if(images.length > 1) {
    			images[0].remove();	
    		}
    	});
  	}
	});
});

var showSelectUserType = function() {
	$('#login').fadeOut(function() {
		$('#login-usertype').fadeIn();	
		$('header .user').fadeIn();
	});
	$('#surrogate').click(showProfileInput);
	$('#overlay').css('background', 'white');
};

var showProfileInput = function() {
	$('#login-usertype').fadeOut(function() {
		$('#profile-setup').fadeIn();
	});
	
	$('#overlay').css('background', 'white');
};

var staticProfile = function() {
	$('.dropImage').prependTo('.currentPatient');
	
	if($('#first_name').val() && $('#last_name').val()) {
		$('.currentPatient h1').html($('#first_name').val() + ' ' + $('#last_name').val());
	}

	if($('#info').val()) {
		$('.holder .info p').html($('#info').val());
	}

	$('.currentPatient h1').css({
		'left': '113px',
		'top': '0px'
	});	

	$('.currentPatient img').css({
		'display': 'inline-block',
		'width': '80px',
		'left': '20px',
		'top': '80px'
	});

	$('#profile-setup').fadeOut(function() {
		$('.holder').slideDown();
		$('.currentPatient').fadeIn();
		$('#login-groupTutorial').fadeIn();	
	});
};

var chooseTeam = function() {
	$('#login-groupTutorial').fadeOut(function() {
		$('#choose-facebook-group').fadeIn();	
	});
	$('#choose-facebook-group ul > li').click(chooseDevice);
};

var chooseDevice = function() {
	$('#choose-facebook-group').fadeOut(function() {
		$('#profile-setup-device-picker').fadeIn();
		$('#profile-setul-group-picker').fadeIn();
		$('#profile-setul-group-picker h3 span').html(8);
	});
	
	$('.go').click(function() {
		window.location = "http://localhost:8081/data";
	});

	$('#upload-animas h2').click(function() {
		$('#upload-animas .device-import').slideToggle();
	});

	$('#upload-dexcom h2').click(function() {
		$('#upload-dexcom .device-import').slideToggle();
	});

	$('#upload-medtronic h2').click(function() {
		$('#upload-medtronic .device-import').slideToggle();
	});
};
