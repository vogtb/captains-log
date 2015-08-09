define(function (require) {
  var $ = require('jquery'),
    moment = require('moment')
    _ = require('underscore'),
    yaml = require('yaml'),
    Handlebars = require('handlebars'),
    loglineTemplate = Handlebars.compile($("#logline-template").html()),
    $logHolder = $('#log-holder'),
    LogFile = {lines: []};

  Handlebars.registerHelper('breaklines', function(text) {
    text = Handlebars.Utils.escapeExpression(text);
    text = text.replace(/(\r\n|\n|\r)/gm, '<br>');
    return new Handlebars.SafeString(text);
  });


  //MAIN LOGIC
  if (_.isUndefined(localStorage.currentLogFile)) {
    localStorage.currentLogFile = 'untitled_log_file';
  }
  if (_.isUndefined(localStorage.currentDirectory)) {
    $('#directions').removeClass('hidden');
    $('#choose-directory').click(chooseDirectory);
  } else {
    $('#directions').remove();
  }
  if (!_.isUndefined(localStorage.currentDirectory) && !_.isUndefined(localStorage.currentDirectory)) {
    loadLogFile();
  }
  $('#main_input').focus();

  function chooseDirectory() {
    var directory = remoteCall('choose-directory');
    if (!directory) {
      alert("I'm sorry, it doesn't look like you chose valid a directory. \nPlease try again.")
    } else {
      localStorage.currentDirectory = directory;
      $('#directions').remove();
    }
  }

  function loadLogFile() {
    var tmpLogFile = get_data({
      'endpoint': 'loadFile',
      'body': {
        'directory': localStorage.currentDirectory,
        'file': localStorage.currentLogFile
      }
    });
    if (tmpLogFile.status === 'OK') {
      LogFile = tmpLogFile.body;
      _.map(LogFile.lines, function (logLineObject) {
        $logHolder.append(loglineTemplate(logLineObject));
      });
      $('#page-content-container').scrollTop($('#page-content-container').height() * 2);
    }
  }


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