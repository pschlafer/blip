var noop = function() {};
var increment = 14;
count = 0;
var isOverview = true;
window.scrollTo(0,0);
var currentView = 'day';

var colors = {
  bolus: '#0998A1',
  carbs: '#CF73E0',
  background: ['#DCE4E8','#E3E9EC','#EAEEF0','#F7F8F9','#F7F8F9','#EAEEF0','#E3E9EC','#DCE4E8']
};

$('body').addClass('stop-scrolling');


$(window).bind("load", function() {
  var speed = 10;

  $('body').addClass('stop-scrolling');

  var toggle = true;
  $('#content').show();
  $(".ani-bg").animate({
    marginTop: '220px'
  }, speed);

  setTimeout(function() {
    $("#content").show();
    timeline.scroll();
  }, speed/2);      

  setTimeout(function() {
    $("#load").fadeOut(500, function() {
      $('body').removeClass('stop-scrolling');
    });
  }, speed);
});

$(function() {
  var first = true;

  var readings = [
  {value: 13, min:10, max: 50, ago: '2 months ago'},
  {value: 5, min:7, max: 30, ago: '5 months ago'},
  {value: 7, min:9, max: 40, ago: '8 months ago'}
  ];

  hba1cWidget('hba1c-image', readings);

  /*$('#one').click(function() {

    $('.tab li').css('font-weight', '100');
    $('#one').css('font-weight', 'bold');
    isTimeline = true;
    $('#chart').hide();
    $('#timelineHolder').show();

    timeline.scroll(bg[bg.length - 1].date, 0);
    first = false;
  });*/

  $('#data-tab').click(function() {$(document).trigger('show-overview')});

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

  var time =  500;
  var up = false;
  $('#cover, .currentPatient img, .currentPatient h1').click(function() {
    if(!up) {
      $('.holder').slideDown(time);
      $(".currentPatient img").animate({
        width: '90px',
        left: '20px',
        top: '80px'
      },time);
      $(".currentPatient h1").animate({
        left: '113px',
        top: '4px'
      },time);  
      up = true;
    } else {
      $('.holder').slideUp(time);
      $(".currentPatient img").animate({
        width: '70px',
        left: '135px',
        top: '32px'
      },time);
      $(".currentPatient h1").animate({
        left: '210px',
        top: '-31px'
      },time);  
      up = false;
    }
    //$(".currentPatient").switchClass( "currentPatient", "currentPatient1",time);
  });

  bg.map(addDate);
  cgm.map(addDate);
  pumpInsulin.map(addDate);
  pumpAdherence.map(addDate);
  pumpEvents.map(addDate);

  timeline = drawTimeline();
  timeline.draw(bg, cgm, pumpSettings, pumpInsulin);

  day = drawDay();
  day.draw(bg, timeline);

  day.scroll(bg[bg.length - 1].date);


  var stat = stats(bg, cgm, pumpInsulin);
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
});

$(function() {
  var showMessages = false;

  $(document).trigger('show-overview');

  $('#messages').click(function() {


    if(showMessages) {
      //$('#messageThread').animate({height:'0px'}, 500);
      
      $('#messageThread').animate({'margin-left': '1088px', width:'0px'}, 500, function() {
        $('#messageThread').hide(0);
      });

      $('#messagetopbar').animate({'margin-left': '1088px', width:'0px'}, 500, function() {
        $('#messagetopbar').hide(0);
      });

      $('#messages').animate({'margin-right': '0px'}, 350);
      $('#timelineContainer').animate({width:'1041px'}, 500);
    } else {
      //$('#messageThread').animate({height:'694px'}, 500);
      $('#messageThread').show(0);
      $('#messageThread').animate({'margin-left': '788px', width:'300px'}, 500);

      $('#messagetopbar').show(0);
      $('#messagetopbar').animate({'margin-left': '790px', width:'300px'}, 500);

      setTimeout(function() {
        $('#messages').animate({'margin-right': '163px'}, 300); 
      }, 150);
      

      $('#timelineContainer').animate({width:'740px'}, 500);
      
    }

    showMessages = !showMessages;               
  });
});
