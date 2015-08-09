define(function (require) {
  var $ = require('jquery'),
    moment = require('moment')
    _ = require('underscore'),
    yaml = require('yaml'),
    Handlebars = require('handlebars'),
    loglineTemplate = Handlebars.compile($("#logline-template").html()),
    $logHolder = $('#log-holder'),
    LogFile = get_data({
      'endpoint': 'logfile'
    }).body; // TODO: error-check this.

    Handlebars.registerHelper('breaklines', function(text) {
      text = Handlebars.Utils.escapeExpression(text);
      text = text.replace(/(\r\n|\n|\r)/gm, '<br>');
      return new Handlebars.SafeString(text);
    });

  $('#main_input').focus();

  _.map(LogFile.lines, function (logLineObject) {
    $logHolder.append(loglineTemplate(logLineObject));
  });
  $('#page-content-container').scrollTop($('#page-content-container').height() * 2);

  function addLine(logLineObject) {
    LogFile.lines.push(logLineObject);
    var result = send_data({
      'endpoint': 'addLogLine',
      'body': logLineObject
    });
    $logHolder.append(loglineTemplate(logLineObject));
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