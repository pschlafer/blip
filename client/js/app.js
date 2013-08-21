var loginin = false;
$(function() {
  data = {};
  view = {
    dataHolder: new (Backbone.View.extend({
      initialize: function() {
        var self = this;
        $.ajax({ url: "/template/dataHolder.ejs" }).done(function(content) {
          self.content = content;
        });
      },
      datum: function(header, user) {
        $.getJSON('http://localhost:8082/v1/device?limit=100000&callback=?', function(datum) {
          console.log('hi', datum);
          view.dataHolder.render(datum);

          if(header) {

            view.header.render(user);
            $('header').css('position','relative');
          }
        });
      },
      render: function(datum) {
        $('#top').hide();
        $('header').hide();
        $('#bottom').show();
        this.$el.html(_.template(this.content));
        
        $('#data-tab').click(function() {$(document).trigger('show-overview')});
        $('#overlay').css('background','rgba(255, 255, 255, 1');
        
        $('header').fadeIn();
        $('.data-holder').fadeIn();

        $('header').css('position','relative');

        $(document).on('show-detail', function() {
          $('#chart').hide();
          $('#timelineHolder').show();
          $('.message-element').show();
        });

        $(document).on('show-overview', function() {
          isOverview = true;
          $('.tab li').css('font-weight', '100');
          $('#data-tab').css('font-weight', 'bold');
          $('.message-element').hide();
          $('#chart').show();
          $('#timelineHolder').hide();

          increment = 14;
        });

        $('.today').click(function() {
          if(!isOverview) {
            timeline.scroll('today');
          } else {
            day.scroll('today');
          }
        });

        $('.arrowup').click(function() {
          if(!isOverview) {
            timeline.scroll(1);
          } else {
            day.scroll(14);
          }
        });

        $('.arrowdown').click(function() {
          if(!isOverview) {
            timeline.scroll(-1);
          } else {
            day.scroll(-14);
          }
        });     

        //bg.map(addDate);
        //cgm.map(addDate);
        //pumpInsulin.map(addDate);
        
        

        
        
        bgs = _.filter(datum, function(entry){ return entry.type  === 'bg'; }).reverse();
        bgs.map(addDate);

        cgms = _.filter(datum, function(entry){ return entry.type  === 'cbg'; }).reverse();
        cgms.map(addDate);

        boluss = _.filter(datum, function(entry){ return entry.type  === 'bolus'; }).reverse();
        boluss.map(addDate);

        basals = _.filter(datum, function(entry){ return entry.type  === 'basal'; }).reverse();
        basals.map(addDate);

        carbs = _.filter(datum, function(entry){ return entry.type  === 'carbs'; }).reverse();
        carbs.map(addDate);

        day = drawDay();
        day.draw(bgs);
        day.scroll(bgs[bgs.length-1].date);

        timeline = drawTimeline();
        timeline.draw(bgs, cgms, boluss, basals, carbs);

        var stat = stats(bgs, cgms, boluss, basals);
        var aw = averageWidget('average-widget', 0, [50,180]);

        var values = [20, 80],
        labels = ['', ''],
        colors = ['white', '#009AA3'],
        bcolors = ['white', '#009AA3'];

        var rangePie = Raphael("range-widget", 54, 54).pieChart(27, 27, 25, values, labels, colors, bcolors, "#B6C6CF");

        $('#chartMain').scroll(function() {
          var average = stat.average(day.scrollTicks()-(14*oneDay), day.scrollTicks());

          if(average) {
            $('#averageData').text(average);
            aw.update(parseInt(average));
            $('#bg-stat').css('opacity', 1);
          } else {
            $('#bg-stat').css('opacity', 0.3);
          }
          
          var range = stat.range(day.scrollTicks()-(14*oneDay), day.scrollTicks());
          
          if(range) {
            $('#rangeData').text(range  + '%');
            var values = [100-range, range];
            if(range == 100) {
              values = [1, 99];
            }
            var labels = ['', ''],
            colors = ['white', '#84C5D9'],
            bcolors = ['white', '#84C5D9'];

            $("#range-widget").children().remove()
            var rangePie = Raphael("range-widget", 54, 54).pieChart(27, 27, 25, values, labels, colors, bcolors, "#B6C6CF");


            $('#range-stat').css('opacity', 1);
          } else {
            $('#range-stat').css('opacity', 0.3);
          }

          var insulinStats = stat.insulinRatio(day.scrollTicks()-(14*oneDay), day.scrollTicks());

          if(insulinStats && insulinStats.basalPercent > 0) {
            $('#insulinData').text(insulinStats.bolusPercent + '%:' + insulinStats.basalPercent + '%');

            var values = [insulinStats.bolusPercent, insulinStats.basalPercent],
            labels = [insulinStats.bolus, insulinStats.basal],
            colors = ['white', '#009AA3'],
            bcolors = ['#009AA3', '#87F4EF'];

            $("#bolus-widget").children().remove()
            var rangePie = Raphael("bolus-widget", 54, 54).pieChart(27, 27, 25, values, labels, colors, bcolors, "#B6C6CF");

            $('#insulin-stat').css('opacity', 1);
          } else {
            $('#insulin-stat').css('opacity', 0.3);
          }
        });

        $('#timelineContainer').scroll(function() {
        var average = stat.average(timeline.scrollTicks(), timeline.scrollTicks()+oneDay);

        if(average) {
          $('#averageData').text(average);
          aw.update(parseInt(average));
          $('#bg-stat').css('opacity', 1);
        } else {
          $('#bg-stat').css('opacity', 0.3);
        }

        var range = stat.range(timeline.scrollTicks(), timeline.scrollTicks()+oneDay);
        $('#rangeData').text();

        if(range) {
          $('#rangeData').text(range  + '%');
          var values = [100-range, range];
          if(range == 100) {
            values = [1, 99];
          }
          var labels = ['', ''],
          colors = ['white', '#84C5D9'],
          bcolors = ['white', '#84C5D9'];

          $("#range-widget").children().remove()
          var rangePie = Raphael("range-widget", 54, 54).pieChart(27, 27, 25, values, labels, colors, bcolors, "#B6C6CF");

          $('#range-stat').css('opacity', 1);
        } else {
          $('#range-stat').css('opacity', 0.3);
        }

        var insulinStats = stat.insulinRatio(timeline.scrollTicks(), timeline.scrollTicks()+oneDay);

        if(insulinStats && insulinStats.basalPercent > 0) {
          $('#insulinData').text(insulinStats.bolusPercent + '%:' + insulinStats.basalPercent + '%');
          
          var values = [insulinStats.bolusPercent, insulinStats.basalPercent],
          labels = [insulinStats.bolus, insulinStats.basal],
          colors = ['white', '#009AA3'],
          bcolors = ['#009AA3', '#87F4EF'];

          
          $("#bolus-widget").children().remove()
          var rangePie = Raphael("bolus-widget", 54, 54).pieChart(27, 27, 25, values, labels, colors, bcolors, "#B6C6CF");

          $('#insulin-stat').css('opacity', 1);
        } else {
          $('#insulin-stat').css('opacity', 0.3);
        }
        });
      }
    }))({el: $("#bottom")}),
    login: new (Backbone.View.extend({
      initialize: function() {
        var self = this;
        $.ajax({ url: "/template/login.ejs" }).done(function(content) {
          self.content = content;
        });
      },
      render: function(username) {
        $('#bottom').hide();
        $('#top').show();
        console.log('hi',this.$el);
        $('#overlay').css('background','rgba(255, 255, 255, 0');
        $('header').css('position','fixed');

        this.$el.html(_.template(this.content));
        $('#login').fadeIn();
        view.header.render();
        $('header').fadeIn();
      },
      fadeOut: function(callback) {
        $('#login').fadeOut(callback);
      },
      events: { 
        "click #loginButton": "join",
        "click #signin": "signin"
      },
      signin: function() {
        FB.login(function(response) {
          if (response.authResponse) {
            accessToken = response.authResponse.accessToken;
            
            $.getJSON('http://localhost:8082/v1/user/facebook?accessToken=' + accessToken + '&callback=?', function(user) {
              view.joinType.render(user);
              view.dataHolder.datum();
            });
          }
        }, {scope: 'user_groups,user_birthday,user_status,user_about_me,publish_actions,email'});
      },
      join: function(event){ 
        loginin = true;
        if(typeof FB == 'undefined') 
          return;

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
    }))({el: $("#top")}),
    header: new (Backbone.View.extend({
      initialize: function() {
        var self = this;
        $.ajax({ url: "/template/header.ejs" }).done(function(content) {
          self.content = content;
        });
      },
      render: function(user) {
        $('header').css('position','fixed');
        this.$el.show();
        this.$el.html(_.template(this.content, {user: user}));
      },
      events: {
        "click #logout": "logout"
      },
      logout: function() {
        FB.logout();
      }
    }))({el: $("header")}),
    joinType: new (Backbone.View.extend({
      initialize: function() {
        var self = this;
        $.ajax({ url: "/template/joinType.ejs" }).done(function(content) {
          self.content = content;
        });
      },
      render: function(user) {
        $('#top').show();
        $('#bottom').hide();
        var self = this;
        
        this.user = user;
        
        $('header').css('position','fixed');
        $('#overlay').css('background','rgba(255, 255, 255, 1');
        
        view.login.fadeOut(function() {
          self.$el.html(_.template(self.content, user));
          
          
          view.header.render(self.user);

          $('header').show();
          $('header .user').fadeIn();
          $('#login-usertype').fadeIn();
        });
      },
      fadeOut: function(callback) {
        $('#login-usertype').fadeOut(callback);
      },
      events: { 
        "click #surrogate": "surrogate",
        "click #t1d": "t1d"
      },
      t1d: function() { 
        data.signup = {type: 'patient', user: this.user};
        view.joinData.render(this.user);
      },
      surrogate: function() {
        data.signup = {type: 'surrogate', user: this.user};
        data.user = this.user;
        view.joinData.render();
      },
      team: function() {
        // todo: setup user and load interface
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
        $('#top').show();
        $('#bottom').hide();
        this.user = user;

        var self = this;

        $('header').css('position','fixed');
        view.joinType.fadeOut(function() {
          console.log('joinData: ', {user: user});
          self.$el.html(_.template(self.content, {user: user}));
          self.$el.find('input').bind('input propertychange', self.isValid);

          Dropzone.options.myAwesomeDropzone = {
            paramName: "file", // The name that will be used to transfer the file
            maxFilesize: 2, // MB
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
          };

          if(user) {
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
        console.log('checking');
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

        var patient = {
          first_name: $('#first_name').val(),
          last_name: $('#last_name').val(),
          summary: $('#profile_textarea').val(),
          id: data.signup.user.id,
          email: data.signup.user.email,
          picture: data.signup.user.picture,
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

        var profile = {};

        if (data.signup.type == 'patient') {
          profile.patient = patient;
        }
        
        if (data.signup.type == 'surrogate') {

          profile.user = data.user;
          profile.patient = patient;

          console.log('profile surrogate', profile);
        }

        $('#form-data').val(JSON.stringify(profile));

        // post data and then display it.
        $.ajax({
          url: 'http://localhost:8082/v1/user/join?accessToken=' + accessToken,
          type: 'POST',
          crossDomain: true,
          xhr: function() {
            var myXhr = $.ajaxSettings.xhr();

            if(myXhr.upload){
              myXhr.upload.addEventListener('progress',function() {console.log('progress')}, false); // For handling the progress of the upload
            }

            return myXhr;
          },
          beforeSend: function(){console.log('beforeSend')},
          success: function(data){
            console.log(data.patient);
            userSignedUp(data);
          },
          error: function(){console.log('error')},
          data: new FormData($('form')[0]),
          cache: false,
          contentType: false,
          processData: false
        });

        var userSignedUp = function(profile) {
          // do something about the real image
          //$('.dropImage').prependTo('#current_patient');
          data.profile = profile;

          $('#current_patient > img').attr('src', profile.patient.picture);
          $('#current_patient h1').html(profile.patient.first_name + ' ' + profile.patient.last_name);
          $('#content-header #patient-profile-info p').html(profile.patient.summary);

          // 13 years old. Diagnosed 3 years ago.
          var old = humanized_time_span(common.format('{year}/{month}/{day}', profile.patient.birth)).replace('ago', 'old');
          var diagnosed = humanized_time_span(common.format('{year}/{month}/{day}', profile.patient.diagnosis));

          $('#minihistory').html(common.format('{0}. Diagnosed {1}', old, diagnosed));

          $('#current_patient h1').css({
            'left': '113px',
            'top': '0px'
          }); 

          $('#current_patient img').css({
            'display': 'inline-block',
            'width': '80px',
            'left': '20px',
            'top': '65px'
          });

          $('#profile-setup').fadeOut(function() {
            $('#content-header').slideDown();
            $('#current_patient').fadeIn();
            view.joinGroupTutorial.render(profile);
          });
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
      render: function(data) {
        $('#top').show();
        $('#bottom').hide();
        var self = this;
        $('header').css('position','fixed');
        view.joinData.fadeOut(function() {
          self.$el.html(_.template(self.content, data));
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

        $.getJSON('http://localhost:8082/v1/groups?administrator=true&accessToken=' + accessToken + '&callback=?', function(groups) {
          console.log(groups);
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
        $('#top').show();
        $('#bottom').hide();
        $('header').css('position','fixed');
        this.$el.html(_.template(this.content, {groups: groups, user: data.profile}));
      
        $('#choose-facebook-group').fadeIn();
        $("#choose-facebook-group li").click(this.select);
      },
      fadeOut: function(callback) {
        $('#choose-facebook-group').fadeOut(callback);
      },
      select: function(event) { 
        $('#choose-facebook-group').fadeOut();

        var id = $(this).attr('id');
        
        $.getJSON('http://localhost:8082/v1/groups/'+ id + '/select?accessToken=' + accessToken + '&callback=?', function() {
          $.getJSON('http://localhost:8082/v1/groups/'+ id + '?accessToken=' + accessToken + '&callback=?', function(group) {
            var lis = _.template("<% _.each(group.team, function(member) {%> <li><img src='<%=member.picture %>'></li><%});%>", {group: group});

            $('#static-team-list').html(lis);
            $('#profile-setul-group-picker').fadeIn();

            view.joinUpload.render();
          });
        });
      }
    }))({el: $("#top")}),
    joinUpload: new (Backbone.View.extend({
      initialize: function() {
        var self = this;
        $.ajax({ url: "/template/joinUpload.ejs" }).done(function(content) {
          self.content = content;
        });
      },
      render: function(groups) {
        $('#top').show();
        $('#bottom').hide();
        $('header').css('position','fixed');
        this.$el.html(_.template(this.content, data.profile));
        this.$el.find('.go').addClass('disabed');
        $('#profile-setup-device-picker').fadeIn();

        Dropzone.options.medtronicCsvDropzone = {
            paramName: "file", // The name that will be used to transfer the file
            maxFilesize: 2, // MB
            url: "/file/post",
            uploadMultiple: false,
            previewTemplate: '<div id="dz-preview-template" class="dz-preview dz-file-preview"><div class="dz-details"><div class="dz-filename"><span data-dz-name></span></div><div class="dz-size" data-dz-size></div><img class="dropImage" data-dz-thumbnail /></div><div class="dz-progress"><span class="dz-upload" data-dz-uploadprogress></span></div></div>',
            init: function() {}
          };
      },
      fadeOut: function(callback) {
        $('#profile-setup-device-picker').slideDown(callback);
      },
      events: { 
        'click #upload-animas h2': 'aminas',
        'click #upload-dexcom h2': 'dexcom',
        'click #upload-medtronic h2': 'medtronic',
        'click #upload-medtronic .done': 'medtronicDone',
        'click .go': 'go'
      },
      go: function () {
        view.dataHolder.datum();
      },
      medtronicDone: function () {
        this.$el.find('.go').removeClass('disabed');
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
    }))({el: $("#top")})
  };
});