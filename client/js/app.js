$(function() {
    view = {
        login: new (Backbone.View.extend({
            initialize: function() {
                var self = this;
                $.ajax({ url: "/template/login.ejs" }).done(function(content) {
                    self.content = content;
                });
            },
            render: function(username) {
                console.log('hi',this.$el);
                $('#overlay').css('background','rgba(255, 255, 255, 0');
                this.$el.html(_.template(this.content));
                $('#login').fadeIn();
                view.header.render();
                $('header').fadeIn();
            },
            fadeOut: function(callback) {
                $('#login').fadeOut(callback);
            },
            events: { 
                "click #loginButton": "join"
            },
            join: function(event){ 
                console.log('login click');
                window.location.hash = 'join';
            }
        }))({el: $("#top")}),
        header: new (Backbone.View.extend({
            initialize: function() {
                var self = this;
                $.ajax({ url: "/template/header.ejs" }).done(function(content) {
                    self.content = content;
                });
            },
            render: function(user) {
                $('header').html(_.template(this.content, user));
            },
            events: {
                "click #username": 'logout'
            },
            logout: function() {
                FB.logout();
            }
        })),
        joinType: new (Backbone.View.extend({
            initialize: function() {
                var self = this;
                $.ajax({ url: "/template/joinType.ejs" }).done(function(content) {
                    self.content = content;
                });
            },
            render: function(user) {
                var self = this;

                $('#overlay').css('background','rgba(255, 255, 255, 1');
                view.login.fadeOut(function() {
                    self.$el.html(_.template(self.content, user));

                    view.header.render({user: user});
                    $('header').show();
                    $('header .user').fadeIn();
                    $('#login-usertype').fadeIn();
                });
            },
            fadeOut: function(callback) {
                $('#login-usertype').fadeOut(callback);
            },
            events: { 
                "click #surrogate": "surrogate"
            },
            t1d: function() { 
            },
            surrogate: function() {
                view.joinData.render();
            },
            team: function() {
            }
        }))({el: $("#top")}),
        joinData: new (Backbone.View.extend({
            initialize: function() {
                var self = this;
                $.ajax({ url: "/template/joinData.ejs" }).done(function(content) {
                    self.content = content;
                });
            },
            render: function(user) {
                var self = this;

                view.joinType.fadeOut(function() {
                    self.$el.html(_.template(self.content));

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

                    $('#profile-setup').fadeIn();
                });

                
            },
            fadeOut: function(callback) {
                $('#profile-setup').fadeOut(callback);
            },
            events: { 
                "click #profile-setup .done": "done"
            },
            done: function() { 
                // todo: validate form
                // todo: bring profile to the form
                $('.dropImage').prependTo('#current_patient');
    
                if($('#first_name').val() && $('#last_name').val()) {
                    $('#current_patient h1').html($('#first_name').val() + ' ' + $('#last_name').val());
                }

                if($('#profile_textarea').val()) {
                    $('#content-header #patient-profile-info p').html($('#profile_textarea').val());
                }

                $('#current_patient h1').css({
                    'left': '113px',
                    'top': '0px'
                }); 

                $('#current_patient img').css({
                    'display': 'inline-block',
                    'width': '80px',
                    'left': '20px',
                    'top': '80px'
                });

                $('#profile-setup').fadeOut(function() {
                    $('#content-header').slideDown();
                    $('#current_patient').fadeIn();
                    view.joinGroupTutorial.render();
                });

                userPatientData = {
                    type: 'surrogte',
                    name: $('#first_name').val(),
                    last_name: $('#last_name').val(),
                    info: $('#profile_textarea').val()
                };

            }
        }))({el: $("#top")}),
        joinGroupTutorial: new (Backbone.View.extend({
            initialize: function() {
                var self = this;
                $.ajax({ url: "/template/joinGroupTutorial.ejs" }).done(function(content) {
                    self.content = content;
                });
            },
            render: function(user) {
                var self = this;

                view.joinData.fadeOut(function() {
                    self.$el.html(_.template(self.content, userPatientData));
                    $('#login-groupTutorial').fadeIn();
                });
            },
            fadeOut: function(callback) {
                $('#login-groupTutorial').fadeOut(callback);
            },
            events: { 
                "click #login-groupTutorial .done": "done"
            },
            done: function() {
                this.fadeOut();

                $.getJSON('http://localhost:8082/v1/groups?selected=false&administrator=true&accessToken=' + accessToken + '&callback=?', function(groups) {
                    view.joinSelectGroup.render(groups);    
                });
            }
        }))({el: $("#top")}),
        joinSelectGroup: new (Backbone.View.extend({
            initialize: function() {
                var self = this;
                $.ajax({ url: "/template/joinSelectGroup.ejs" }).done(function(content) {
                    self.content = content;
                });
            },
            render: function(groups) {
                this.$el.html(_.template(this.content, {groups: groups, user: userPatientData}));
                $('#choose-facebook-group').fadeIn();
                $("#choose-facebook-group li").click(this.select);
            },
            fadeOut: function(callback) {
                $('#choose-facebook-group').fadeOut(callback);
            },
            select: function(event) { 
                $('#choose-facebook-group').fadeOut();
                console.log(event);

                var id = $(this).attr('id');
                console.log('id', id);

                //todo: get members of facebook group and add them to the data
                $.getJSON('http://localhost:8082/v1/groups/'+ id + '?accessToken=' + accessToken + '&callback=?', function(group) {
                    console.log('got group: ', JSON.stringify(group));

                    var lis = _.template("<% _.each(group.team, function(member) {%> <li><img src='<%=member.picture %>'></li><%});%>", {group: group});

                    $('#static-team-list').html(lis);
                    $('#profile-setul-group-picker').fadeIn();

                    view.joinUpload.render();
                });
            },
        }))({el: $("#top")}),
        joinUpload: new (Backbone.View.extend({
            initialize: function() {
                var self = this;
                $.ajax({ url: "/template/joinUpload.ejs" }).done(function(content) {
                    self.content = content;
                });
            },
            render: function(groups) {
                this.$el.html(_.template(this.content, userPatientData));
                $('#profile-setup-device-picker').fadeIn();
            },
            fadeOut: function(callback) {
                $('#profile-setup-device-picker').slideDown(callback);
            },
            events: { 
                'click #upload-animas h2': 'aminas',
                'click #upload-dexcom h2': 'dexcom',
                'click #upload-medtronic h2': 'medtronic',
                'click .go': 'go'
            },
            go: function () {
                window.location = "http://localhost:8081/data";        
            },
            aminas: function() {
                $('#upload-animas .device-import').slideToggle();        
            },
            dexcom: function() {
                $('#upload-dexcom .device-import').slideToggle();        
            },
            medtronic: function() {
                $('#upload-medtronic .device-import').slideToggle();        
            }
        }))({el: $("#top")}),
    };

    new (Backbone.Router.extend({
      routes: {
        '': 'home',
        'join': 'join'
      },
      home: function() {
        //view.splash.render();
      },
      join: function() {
        FB.login(function(response) {
          if (response.authResponse) {
            accessToken = response.authResponse.accessToken;

            // todo: also check blip groups this user already has access to            
            $.getJSON('http://localhost:8082/v1/user/facebook?accessToken=' + accessToken + '&callback=?', function(user) {
                view.joinType.render(user);
            });
            
          } else {
            window.location.hash = '';
          }
        }, {scope: 'user_groups,user_birthday,user_status,user_about_me,publish_actions,email'});
      }
    }));

    Backbone.history.start();
})