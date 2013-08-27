/*
pumpSettings
  pumpAdherence

  // #MVP 1
  {
    "basal":"0.525",
    "posix":1357610460000
  },
  // #MVP 1
  {
    "bolus_type":"Normal", // 2
    "bolus":"0.75",
    "posix":1357628760000
  },
    // #MVP 1
  {
    "carbs":"45.0",
    "posix":1357629600000
  },
    //  #MVP 1
  {
    "bg":"144.0",
    "posix":1359810780000
  },
  //  #MVP 1
  {
    "cbg":"162",
    "posix":1359810780000
  },
*/

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

//$('body').addClass('stop-scrolling');


$(window).bind("loads", function() {
  var speed = 10;

  //$('body').addClass('stop-scrolling');

  var toggle = true;
  $('#content').show();
  $(".ani-bg").animate({marginTop: '220px'}, speed);

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