$(function() {

view.dataHolder = new (Backbone.View.extend({
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
        thisData = datum;
        firstDay = datum[datum.length-1].unixTime;

        callback(null, {
          group: group,
          data: datum
        });
      });
    });
  },
  render: function(datum, administrator) {
    view.overlay.white();
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
}))({el: $("#bottom")});

});