var timeline;

$(function() {

view.dataHolder = new (Backbone.View.extend({
  initialize: function() {
    var self = this;
    $.ajax({ url: "/template/dataHolder.ejs" }).done(function(content) {
      self.content = content;
    });
  },
  render: function(groupId) {
    var self = this;
    view.overlay.wait('Loading Data');

    common.step([
      function(next) {
        model.groups.get(groupId, next.parallel());
        model.deviceData(groupId, next.parallel());
      },
      function(items, next) {
        var group = items[0];
        var readings = items[1];

        firstDay = startOfDayTicks(readings[readings.length-1].unixTime);

        view.header.render({ patient: group.patient, top: true, handel: true, showPatient: false, logout: true, groupId: groupId});
        
        self.$el.html(_.template(self.content, {administrator: group.administrator}));
        
        self.bindElements(group, readings);
        
        view.overlay.white();
        setTimeout(function() {view.overlay.white();}, 100);
      }],function(error) {
        alert('Error fetching data');
        console.log('error:', error);
      }
    );
  },
  bindElements: function(group, readings) {
    (new viewClass.Upload({el: $("#upload_tab_content")})).render(group.id, true);

    view.messages = new viewClass.Messages({el: $("#messagesThreadHolder")});
    view.messages.load(group.id);
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
    $('.data-holder').fadeIn();

    $(document).on('show-detail', function() {
      view.messages.showTab();
      $('#chart').hide();
      $('#timelineHolder').show();
      $('.message-element').show();
      isOverview = false;
    });

    $(document).on('show-overview', function() {
      $('.tab li').css('font-weight', '100');
      $('#data-tab').css('font-weight', 'bold');
      $('.message-element').hide();
      $('#chart').show();
      view.messages.hideTab();
      $('#timelineHolder').hide();
      increment = 14;
      isOverview = true;
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

    bgs = _.filter(readings, function(entry){ return entry.type  === 'smbg'; }).reverse();
    bgs.map(addDate);

    cgms = _.filter(readings, function(entry){ return entry.type  === 'cbg'; }).reverse();
    cgms.map(addDate);

    boluss = _.filter(readings, function(entry){ return entry.type  === 'bolus'; }).reverse();
    boluss.map(addDate);

    basals = _.filter(readings, function(entry){ return entry.type  === 'basal'; }).reverse();
    basals.map(addDate);

    carbs = _.filter(readings, function(entry){ return entry.type  === 'carbs'; }).reverse();
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

    if(!isOverview) {
      view.messages.showTab();  
    }
  },
  uploadTab: function() {
    $('#data-tab').css({'font-weight': 'lighter'});
    $('#upload-tab').css({'font-weight': 'bold'});

    $('#data_tab_content').hide();
    $('.time-picker').hide();
    $('#upload_tab_content').show();

    view.messages.hideTab();
  }
}))({el: $("#bottom")});

});