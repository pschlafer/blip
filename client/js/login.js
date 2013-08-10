
$(function() {
	$('#loginButton').click(function() {
		console.log('hi');
		$('#login').fadeOut();
		$('#login-usertype').fadeIn(1150);

		$('#surrogate').click(showProfileInput);

	});
	
	
	$('#facebook-groups > li').click(chooseDevice);

		$("div#profile-image").dropzone({ 
		url: "/file/post",
		uploadMultiple: false,
		previewTemplate: '<div id="dz-preview-template" class="dz-preview dz-file-preview"><div class="dz-details"><div class="dz-filename"><span data-dz-name></span></div><div class="dz-size" data-dz-size></div><img class="dropImage" data-dz-thumbnail /></div><div class="dz-progress"><span class="dz-upload" data-dz-uploadprogress></span></div></div>',
	 });

});

var showProfileInput = function() {
	$('#login-usertype').hide();
	window.scrollTo(0,0);
	
	$('#login-groupTutorial').show();
	$('body').addClass('stop-scrolling');
	$('#profile-setup').show();

	$('header').css('position','relative');
}

var staticProfile = function() {
	
	if($('#first_name').val() && $('#last_name').val())
	$('#fullname').html($('#first_name').val() + ' ' + $('#last_name').val());
	if($('#info').val())
	$('#tidbits').html($('#info').val());

	$('#profile-setup-form').hide();
	$('#profile-setup-static').show();

	$('#profile-setup #profile-image').css({margin: '20px 20px 20px 0'})
	$('#profile-setup h1').hide();
	$('#login-groupTutorial').css({opacity: 1});

	$('body').removeClass('stop-scrolling');
	$('#line').show();
}

var chooseTeam = function() {
	$('#main').css({background: 'white'});
	$('#line').hide();
	$('#login-groupTutorial').hide();
	$('#profile-setul-group-picker').show();
	$('body').addClass('stop-scrolling');
	$('#profile-setup-device-picker').show();
	$('#profile-setup-device-picker').css({opacity: 0.2});
	window.scrollTo(0,0);
}

var chooseDevice = function() {

	$('.go').click(function() {
		window.location = "http://localhost:8081/data";
	});
	$('#profile-setup-device-picker').css({opacity: 1});
	$('body').removeClass('stop-scrolling');
	$('#static-team-list').show();
	$('#facebook-groups').hide();
	$('#profile-setul-group-picker p').hide();
	$('#profile-setul-group-picker h3 span').html(8);

	$('#upload-animas h2').click(function() {
		$('#upload-animas .device-import').toggle();
	});

	$('#upload-dexcom h2').click(function() {
		$('#upload-dexcom .device-import').toggle();
	});

	$('#upload-medtronic h2').click(function() {
		$('#upload-medtronic .device-import').toggle();
	});
}
