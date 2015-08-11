define(function (require) {
  var $ = require('jquery'),
    moment = require('moment')
    _ = require('underscore'),
    yaml = require('yaml'),
    local_mode = true,
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
    $('#warning').removeClass('hidden');
  } else {
    local_mode = false;
    $('#filename').html(localStorage.currentLogFile);
  }
  if (_.isUndefined(localStorage.currentDirectory)) {
    $('#directions').removeClass('hidden');
    $('#choose-directory').click(chooseDirectory);
  } else {
    $('#directions').remove();
  }
  loadLogFile();
  $('#main-input').focus();
  $('#filename').removeClass('hidden');

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
    if (local_mode) {
      if (_.isUndefined(localStorage.localLogFile)) {
        localStorage.localLogFile = JSON.stringify({lines: []});
      }
      LogFile = JSON.parse(localStorage.localLogFile);
    } else {
      LogFile = get_data({
        'endpoint': 'loadFile',
        'body': {
          'directory': localStorage.currentDirectory,
          'file': localStorage.currentLogFile
        }
      }).body;
    } 
    _.map(LogFile.lines, function (logLineObject) {
      $logHolder.append(loglineTemplate(logLineObject));
    });
    $('#page-content-container').scrollTop($('#page-content-container').height() * 2);
  }

  function addLine(logLineObject) {
    LogFile.lines.push(logLineObject);
    if (local_mode) {
      localStorage.localLogFile = JSON.stringify(LogFile);
    } else {
      var result = send_data({
        'endpoint': 'addLogLine',
        'body': {
          'directory': localStorage.currentDirectory,
          'file': localStorage.currentLogFile,
          'line': logLineObject
        }
      });
    }
    $logHolder.append(loglineTemplate(logLineObject));
  }

  function getAndClearLogline() {
    var line = $('#main-input').val();
    $('#main-input').val('');
    return line;
  }

  $('#main-input').keydown(function (e) {
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

  $('#filename').keypress(function (event) {
    if (event.which !== 0) {
      var character = String.fromCharCode(event.which);
      if (event.which === 13) {
        $('#main-input').focus();
      }
      return !/[^a-zA-Z0-9]/.test(character);
    }
  });
  $('#filename').on('focusout', function (event) {
    if ($(this).text() != 'untitlted_log_file') {
      updateState();
    }
  });

  function updateState() {
    if (local_mode) {
      localStorage.currentLogFile = $('#filename').text();
      local_mode = false;
      $('#warning').addClass('hidden');
      send_data({
        'endpoint': 'addManyLogLine',
        'body': {
          'lines': LogFile.lines,
          'file': localStorage.currentLogFile,
          'directory': localStorage.currentDirectory
        }
      });
    } else {
      // changing the name of the file...
      localStorage.currentLogFile = $('#filename').text();
      console.log('changing name of log file.')
      send_data({
        'endpoint': 'changeFileName',
        'body': {
          'file': localStorage.currentLogFile,
          'directory': localStorage.currentDirectory
        }
      });
    }
  }

});