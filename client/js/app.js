var loginin = false;
$(function() {
  data = {};

  callit = function() {
          console.log('call it');
        }
  viewClass = {
    Upload: Backbone.View.extend({
      initialize: function() {
      },
      render: function(groupId, tab) {
        var self = this;
        $.ajax({ url: "/template/joinUpload.ejs" }).done(function(template) {
          self.groupId = groupId;

          if(tab) {
            $('#top').hide();
            $('#bottom').show();
          } else {
            $('#bottom').hide();  
            $('#top').show();
          }
          
          var html = _.template(template, tab ? {} : data.profile);
          
          self.$el.html(html);  
          self.$el.find('.go').addClass('disabed');

          $('#profile-setup-device-picker').fadeIn();

          console.log('el',self.$el);

          self.$el.find('#upload-animas h2').click(self.aminas);
          self.$el.find('#upload-medtronic h2').click(self.medtronic);
          self.$el.find('#upload-dexcom h2').click(self.dexcom);
          self.$el.find('input[type=file]').change(self.ready);

          if(tab) {
            self.$el.find('.go').click(self.upload(groupId, tab));          
          } else {
            self.$el.find('.go').click(self.upload(groupId));
          }
        });
      },
      fadeOut: function(callback) {
        $('#profile-setup-device-picker').slideDown(callback);
      },
      ready: function () {
        $('#uploadButton').removeClass('disabed');
      },
      upload: function (groupId, tab) {
        return function() {
          $.ajax({
            url: 'http://'+$('#api_endpoint').attr('content')+'/v1/' + groupId + '/device/upload',
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
            success: function(data) {
              console.log('success');

              if(tab) {
                view.dataHolder.dataTab();
                var upload = new viewClass.Upload({el: $("#upload_tab_content")});        
                upload.render(groupId, true);
                loadData(groupId);
              } else {
                window.location.hash = 'group/' + groupId;
              }
            },
            error: function(error){
              console.log('Error uploading files', error);
              var upload = new viewClass.Upload({el: $("#upload_tab_content")});        
              upload.render(this.groupId, true);
            },
            data: new FormData($('form')[0]),
            cache: false,
            contentType: false,
            processData: false
          });
        }
      },
      aminas: function() {
        console.log('toggle');
        $('#upload-animas .device-import').slideToggle();
      },
      dexcom: function() {
        $('#upload-dexcom .device-import').slideToggle();
      },
      medtronic: function() {
        $('#upload-medtronic .device-import').slideToggle();
      }
    }),
    Messages: Backbone.View.extend({
      initialize: function() {
      },
      render: function(messages) {
        var self = this;
        $.ajax({ url: "/template/messages.ejs" }).done(function(template) {
          console.log('messages', messages);

          var html = _.template(template, {messages: messages || []});
          
          for(var i in messages) {
            timeline.drawComment(messages[i].createdTime.unixTime);
          }

          self.$el.html(html);  

          $(".thread >li").click(function() {
            timeline.scrollTo($(this).attr('id'));
          });

        });
      },
      load: function(groupId) {
        var self = this;
        this.get(groupId, function(error, messages) {
          self.render(messages);
        });
      },
      get: function(groupId, callback) {
        $.getJSON('http://'+$('#api_endpoint').attr('content')+'/v1/group/'+ groupId +  '/messages?accessToken=' + accessToken + '&callback=?', function(messages) {
          callback(null, messages);
        });
      },

      messagesShown: false,
      hideTab: function() {
        $('.communication').hide();
        $('#messagesThreadHolder').hide();
      },
      scrollTo: function(id) {
        $('.thread').animate({
            scrollTop: $(".thread #" + id).offset().top
        });
      },
      showTab: function() {
        $('.communication').show();
        $('#messagesThreadHolder').show();
      },
      toggleMessages: function(show) {
        if(show) {
          $('#messageThread').show(0);
          $('#messageThread').animate({'margin-left': '788px', width:'300px'}, 500);

          setTimeout(function() {
            $('#messages').animate({'margin-right': '163px'}, 300); 
          }, 150);
          
          $('#timelineContainer').animate({width:'740px'}, 500); 
        } else {
          $('#messageThread').animate({'margin-left': '1088px', width:'0px'}, 500, function() {
            $('#messageThread').hide(0);
          });

          $('#messages').animate({'margin-right': '0px'}, 350);
          $('#timelineContainer').animate({width:'1041px'}, 500);
        }
        this.messagesShown = !this.messagesShown;
      }
    })
  };  

  view = {
    dataHolder: new (Backbone.View.extend({
      initialize: function() {
        var self = this;
        $.ajax({ url: "/template/dataHolder.ejs" }).done(function(content) {
          self.content = content;
        });
      },
      get: function(groupId, user, callback) {
        this.groupId = groupId;

        $.getJSON('http://'+$('#api_endpoint').attr('content')+'/v1/groups/' + groupId + '?accessToken=' + accessToken + '&callback=?', function(group) {
          $.getJSON('http://'+$('#api_endpoint').attr('content')+'/v1/' + groupId + '/device?limit=100000&callback=?', function(datum) {
            firstDay = datum[datum.length-1].unixTime;

            callback(null, {
              group: group,
              data: datum
            });
          });
        });
      },
      render: function(datum, administrator) {
        $('#top').hide();
        $('header').hide();
        $('#bottom').show();
        
        this.$el.html(_.template(this.content, {administrator: administrator}));
        
        var upload = new viewClass.Upload({el: $("#upload_tab_content")});
        view.messages = new viewClass.Messages({el: $("#messagesThreadHolder")});

        upload.render(this.groupId, true);
        view.messages.load(this.groupId);
        view.messages.hideTab();
        
        var messagesShown = false;

        $('#messages').click(function() {
          messagesShown = !messagesShown;
          view.messages.toggleMessages(messagesShown);
        });

        $(".thread >li").click(function() {
          timeline.scrollTo($(this).attr('id'));
        });

        $('#data-tab').click(function() {$(document).trigger('show-overview')});
        $('#overlay').css('background','rgba(255, 255, 255, 1');
        
        $('header').fadeIn();
        $('.data-holder').fadeIn();

        $('header').css('position','relative');

        $(document).on('show-detail', function() {
          $('#chart').hide();
          $('#timelineHolder').show();
          view.messages.showTab();
          $('.message-element').show();
        });

        $(document).on('show-overview', function() {
          isOverview = true;
          $('.tab li').css('font-weight', '100');
          $('#data-tab').css('font-weight', 'bold');
          $('.message-element').hide();
          $('#chart').show();
          view.messages.hideTab();
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
        
        bgs = _.filter(datum, function(entry){ return entry.type  === 'smbg'; }).reverse();
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
      },
      events: {
        'click #upload-tab': 'uploadTab',
        'click #data-tab': 'dataTab'
      },
      dataTab: function() {
        $('#upload-tab').css({'font-weight': 'lighter'});
        $('#data-tab').css({'font-weight': 'bold'});


        $('#upload_tab_content').hide();
        $('#data_tab_content').show();
        $('.time-picker').show();
      },
      uploadTab: function() {
        $('#data-tab').css({'font-weight': 'lighter'});
        $('#upload-tab').css({'font-weight': 'bold'});

        $('#data_tab_content').hide();
        $('.time-picker').hide();
        $('#upload_tab_content').show();
      }
    }))({el: $("#bottom")}),
    home: {
      start: function() {
        // get the users groups admin
        // if 1 change url to that group id.
        // if > 1 render dashboard todo: build dashboard
        // make something catch that url.

        $.getJSON('http://'+$('#api_endpoint').attr('content')+'/v1/groups?administrator=true&selected=true&accessToken=' + accessToken + '&callback=?', function(groups) {
          if(groups.length) {
            window.location.hash = 'group/' + groups[0].id;  
          } else {
            alert('looks like you dont have access to any group');
          }
        });
      }
    },
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
        
        view.header.render({}, {top:false, handel:false, logout: false});

        $('header').fadeIn();
      },
      fadeOut: function(callback) {
        $('#login').fadeOut(callback);
      },
      events: { 
        "click #loginButton": "join",
        "click #signin": "signin"
      },
      isUser: function(callback) {
        $.getJSON('http://'+$('#api_endpoint').attr('content')+'/v1/user?accessToken=' + accessToken + '&callback=?', function(user) {
          callback(null, user);
        });
      },
      signin: function() {
        FB.login(function(response) {
          if (response.authResponse) {
            accessToken = response.authResponse.accessToken;
            
            window.location.hash = 'dashboard';
          }
        }, {scope: 'user_groups,user_birthday,user_status,user_about_me,publish_actions,email'});
      },
      join: function(event){ 
        if(typeof FB == 'undefined') 
          return;

        FB.login(function(response) {
          if (response.authResponse) {
            accessToken = response.authResponse.accessToken;
            // todo: also check blip groups this user already has access to            
            view.login.isUser(function(error, user) {
              if(error) {
                console.error(error);
                return;
              }

              if(!user.fb) {
                window.location.hash = 'dashboard';
              } else {
                $.getJSON('http://'+$('#api_endpoint').attr('content')+'/v1/groups?selected=true&administrator=false&accessToken=' + accessToken + '&callback=?', function(groups) {
                  view.joinType.render({
                    user: user.fb || user,
                    groups: groups
                  });
                });
              }
            });
          } else {
            window.location.hash = '';
          }
        }, {scope: 'user_groups,user_birthday,user_status,user_about_me,publish_actions,email'});
      }
    }))({el: $("#top")}),
    header: new (Backbone.View.extend({
      patientShown: false,
      initialize: function() {
        var self = this;
        $.ajax({ url: "/template/header.ejs" }).done(function(content) {
          self.content = content;
        });
      },
      render: function(data, options) {
        data.options = options;

        this.$el.html(_.template(this.content, data));

        if(options.top) {
          this.top();
        } else {
          this.bottom();
        }

        if(options.showPatient) {
          this.patientShown = true;
          this.showPatient();
        } else {
          this.patientShown = false;
          this.hidePatient();
        }
        this.$el.show();
      },
      events: {
        "click #logout": "logout",
        "click #handel-header": "togglePatient"
      },
      togglePatient: function() {
        if(view.header.patientShown) {
          view.header.hidePatient();
        } else {
          view.header.showPatient();
        }
        view.header.patientShown = !view.header.patientShown;
      },
      hidePatient: function() {
        $('#content-header').slideUp();  

        $('#current_patient h1').animate({
          top: '-35px',
          left: '215px'
        });

        $('#current_patient img').animate({
          width: '70px',
          left: '135px',
          top: '32px'
        });
      },
      showPatient: function() {
        $('#content-header').slideDown();  

        $('#current_patient h1').animate({
          top: '5px',
          left: '112px'
        });

        $('#current_patient img').animate({
          width: '80px',
          left: '20px',
          top: '80px'
        });
      },
      top: function() {
        this.$el.css('position','relative');
      },
      bottom: function() {
        this.$el.css('position','fixed');
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
      render: function(data) {
        $('#top').show();
        $('#bottom').hide();
        var self = this;
        
        this.user = data.user;
        
        $('header').css('position','fixed');
        $('#overlay').css('background','rgba(255, 255, 255, 1');
        
        view.login.fadeOut(function() {
          self.$el.html(_.template(self.content, data));
          
          view.header.render({user: self.user}, {top:false, handel: false, logout: true});

          $('#login-usertype').fadeIn();
        });
      },
      fadeOut: function(callback) {
        $('#login-usertype').fadeOut(callback);
      },
      events: { 
        "click #surrogate": "surrogate",
        "click #t1d": "t1d",
        "click #team-member": "member"
      },
      member:function() {
        view.dashboard.render();
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

          /*Dropzone.options.myAwesomeDropzone = {
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
          };*/

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
        }

        $('#form-data').val(JSON.stringify(profile));

        // post data and then display it.
        $.ajax({
          url: 'http://'+$('#api_endpoint').attr('content')+'/v1/user/join?accessToken=' + accessToken + '&callback=?',
          type: 'POST',
          crossDomain: true,
          xhr: function() {
            var myXhr = $.ajaxSettings.xhr();

            if(myXhr.upload){
              myXhr.upload.addEventListener('progress',function() {console.log('progress')}, false); // For handling the progress of the upload
              myXhr.upload.addEventListener("load", function() {console.log('load')}, false);
            }

            return myXhr;
          },
          beforeSend: function(){ 
            console.log('beforeSend')
          },
          success: function(data){
            view.login.isUser(function(err, user) {
              userSignedUp({
                data: data,
                user: user.fb || user
              });
            });
          },
          complete: function() {
            console.log('complete');
          },
          error: function(error){ 
            console.log('error posting new user')
          },
          data: new FormData($('form')[0])
        });

        var userSignedUp = function(info) {
          console.log(info);

          // do something about the real image
          //$('.dropImage').prependTo('#current_patient');
          data.profile = info.data;

          view.header.render({
            patient: info.user.patient,
            user: info.user
          }, {top: false, handel: false, logout: true, showPatient: true});

          $('#profile-setup').fadeOut(function() {
            $('#content-header').slideDown();
            $('#current_patient').fadeIn();
            view.joinGroupTutorial.render(info.data);
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

        $.getJSON('http://'+$('#api_endpoint').attr('content')+'/v1/groups?administrator=true&accessToken=' + accessToken + '&callback=?', function(groups) {
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

        var groupId = $(this).attr('id');

        $.getJSON('http://'+$('#api_endpoint').attr('content')+'/v1/groups/'+ groupId + '/select?accessToken=' + accessToken + '&callback=?', function() {
          $.getJSON('http://'+$('#api_endpoint').attr('content')+'/v1/groups/'+ groupId + '?accessToken=' + accessToken + '&callback=?', function(group) {
            view.login.isUser(function(err, user) {
              view.header.render({
                patient: group.patient,
                user: user.fb || user,
                team: group.team
              }, {top: false, handel: false, logout: true});
              view.joinUpload.render(groupId);
            }); 
          });
        });
      }
    }))({el: $("#top")}),
    dashboard: new (Backbone.View.extend({
      initialize: function() {
        var self = this;
        $.ajax({ url: "/template/dashboard.ejs" }).done(function(content) {
          self.content = content;
        });
      },
      render: function() {
        var self = this;

        $('#top').hide();
        $('#bottom').show();
        $('#bottom').html('');
        $('#overlay').css('background','rgba(255, 255, 255, 1');
        
        view.login.isUser(function(err, user) {
          view.header.render({ user: user.fb || user }, {top: true, handel: false, logout: true});
        });
        
        this.get(function(error, groups) {
          if(groups.length) {
            if(groups.length === 1) {
              window.location.hash = 'group/' + groups[0].id;  
              return;
            }
            self.$el.html(_.template(self.content, { groups: groups }));
          } else {
            alert('looks like you dont have access to any group');
          }
        });
      },
      get: function(callback) {
        $.getJSON('http://'+$('#api_endpoint').attr('content')+'/v1/groups?selected=true&accessToken=' + accessToken + '&callback=?', function(groups) {
          console.log(groups);
          callback(null, groups);
        });
      }
    }))({el: $("#bottom")}),
    joinUpload: new viewClass.Upload({el: $("#bottom")})
  };

  $('#overlay').css('background','rgba(255, 255, 255, 1');
});

var loadData = function(id) {
  view.login.isUser(function(err, user) {
    view.dataHolder.get(id, user || {}, function(err, data) {
      console.log(data.group);
      view.header.render({
        patient: data.group.patient,
        user: user.fb || user,
        team: data.group.team
      }, {top: true, handel: true, logout: true});

      var group = _.find(user.groups || [], function(g) {return g.id === id}) || {};

      console.log('data', data);
      console.log('user', user);
      view.dataHolder.render(data.data, group.administrator);
    }); 
  });
};

var Router = Backbone.Router.extend({
  routes: {
    'dashboard': 'dashboard',
    'group/:id' : 'groupData'
  },
  dashboard: function() {
    view.login.isUser(function(err, user) {
      view.dashboard.render();
    });
  },
  groupData: loadData
});