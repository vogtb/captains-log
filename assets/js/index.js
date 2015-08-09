define(function (require) {
  var $ = require('jquery'),
    moment = require('moment')
    _ = require('underscore'),
    yaml = require('yaml'),
    Handlebars = require('handlebars'),
    loglineTemplate = Handlebars.compile($("#logline-template").html()),
    $logHolder = $('#log-holder'),
    LogFile = get_data('logfile');

    Handlebars.registerHelper('breaklines', function(text) {
      text = Handlebars.Utils.escapeExpression(text);
      text = text.replace(/(\r\n|\n|\r)/gm, '<br>');
      return new Handlebars.SafeString(text);
    });

  $('#main_input').focus();

  _.map(LogFile.lines, function (logObject) {
    $logHolder.append(loglineTemplate(logObject));
  });

  function addLine(logObject) {
    LogFile.lines.push(logObject);
    send_data(logObject);
    $logHolder.append(loglineTemplate(logObject));
  }

  function getAndClearLogline() {
    var line = $('#main_input').val();
    $('#main_input').val('');
    return line;
  }

  $('#main_input').keyup(function (e) {
    if (e.which == 13) {
      var time = moment(),
        line = getAndClearLogline();
      addLine({
        text: {
          type: 'text',
          line: line
        },
        time: time.format("ddd MMM DD YYYY, h:mm a"),
        timestamp: time.valueOf()
      });
    }
  });
});