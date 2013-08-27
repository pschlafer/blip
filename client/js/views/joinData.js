$(function() {

view.joinData = new (Backbone.View.extend({
  initialize: function() {
    var self = this;
    $.ajax({ url: "/template/joinData.ejs" }).done(function(content) {
      self.content = content;
    });
  },
  render: function() {
    var self = this;

    view.overlay.white();
    this.$el.show();

    view.joinType.fadeOut(function() {
    	var user = data.user.fb || data.user;

      if(data.signup === 'surrogate') {
      	self.$el.html(_.template(self.content, {user: null}));
      } else {
      	self.$el.html(_.template(self.content, {user: user}));	
      }
      
      self.$el.find('input').bind('input propertychange', self.isValid);

      if(data.signup !== 'surrogate') {
        $('#profileImage').show();
        $('#form_picture_file').hide();
        $('#first_name').val(user.first_name);  
        $('#last_name').val(user.last_name);

        if(user.birthday) {
          var parts = user.birthday.split('/');
          
          $('#dob-month').val(parseInt(parts[0])-1);  
          $('#dob-day').val(parseInt(parts[1]));  
          $('#dob-year').val(parseInt(parts[2]));  
        }
      }

      $('#profile-setup').fadeIn();
    });
  },
  fadeOut: function(callback) {
    $('#profile-setup').fadeOut(callback);
  },
  events: { 
    "click #profile-setup .done": "done",
    "change select": "isValid"
  },
  isValid: function() {
    if (view.joinData.validate()) {
      view.joinData.$el.find('.done').removeClass('disabed');
    } else {
      view.joinData.$el.find('.done').addClass('disabed');
    }
  },
  validate: function() {
    if (!$('#first_name').val() || !$('#last_name').val())
      return false;

    if (!$('#dob-month').val() || !$('#dob-day').val() || !$('#dob-year').val())
      return false;

    if (!$('#dod-month').val() || !$('#dod-year').val())
      return false;

    if ($('#dod-month').val() === 'choose' || $('#dod-year').val() === 'choose')
      return false;

    if ($('#dob-month').val() === 'choose' || $('#dob-day').val() === 'choose' || $('#dob-year').val() === 'choose')
      return false;

    if ($('#dod-month').val() < $('#dob-month').val() && $('#dod-year').val() < $('#dob-year').val())
      return false;

    return true;
  },
  done: function() { 
    if(!this.validate()) {
      return;
    }

    var user = data.user.fb || data.user;

    var patient = {
      first_name: $('#first_name').val(),
      last_name: $('#last_name').val(),
      summary: $('#profile_textarea').val(),
      id: user.id,
      email: user.email,
      picture: user.picture,
      birth: {
        month: parseInt($('#dob-month').val()) + 1,
        day: parseInt($('#dob-day').val()) + 1,
        year: $('#dob-year').val()
      },
      diagnosis: {
        month: parseInt($('#dod-month').val()) + 1,
        day: 1,
        year: $('#dod-year').val()
      }
    };

    var profile = {
    	patient: patient
    };

    if (data.signup.type === 'surrogate') {
      profile.user = user;
    }

    $('#form-data').val(JSON.stringify(profile));

    model.post.user(function(error, data) {
    	console.log('user crated', error, data);

    	if(error) {
    		alert('An error occured creating user.');
    		return;
    	}
    	
      view.header.render({top: true, handel: false, showPatient: true});

      view.joinData.fadeOut(function() {
      	$('#content-header').slideDown();
        $('#current_patient').fadeIn();
        view.joinGroupTutorial.render(data);
      });
    });
  }
}))({el: $("#bottom")});

});