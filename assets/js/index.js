define(function (require) {
  var $ = require('jquery'),
    moment = require('moment'),
    yaml = require('yaml'),
    Handlebars = require('handlebars'),
    loglineTemplate = Handlebars.compile($("#logline-template").html()),
    $logHolder = $('#log-holder'),
    LogFile = {
      title: 'Name Here',
      lines: []
    };

  $('#main_input').focus();

  function addLine(logObject) {
    LogFile.lines.push(logObject);
    console.log(yaml.safeDump(LogFile));
    var html = loglineTemplate(logObject);
    $logHolder.append(html);
  }

  function getAndClearLogline() {
    var line = $('#main_input').val();
    $('#main_input').val('');
    return line;
  }

  $('#main_input').keyup(function (e) {
    if (e.which == 13) {
      var time = moment();
      addLine({
        type: 'text',
        text: getAndClearLogline(),
        timestring: time.format("ddd MMM DD YYYY, h:mm a"),
        timestamp: time.valueOf()
      })
    }
  });
});