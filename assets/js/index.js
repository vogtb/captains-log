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

  ensureDirectory();
  setMode();
  loadLogFile();
  renderLogFile();
  readyForUser();

  function ensureDirectory() {
    if (_.isUndefined(localStorage.directory)) {
      $('#directions').removeClass('hidden');
      $('#choose-directory').click(chooseDirectory);
    } else {
      $('#directions').remove();
    }
  }

  function setMode() {
    local_mode = _.isUndefined(localStorage.directory) || _.isUndefined(localStorage.file);
  }

  function readyForUser() {
    $('#main-input').focus();
    if (!_.isUndefined(localStorage.file)) {
      $('#filename').text(localStorage.file);
    }
    if (local_mode) {
      $('#warning').removeClass('hidden');
    }
    $('#filename').removeClass('hidden'); 
  }

  function chooseDirectory() {
    var directory = remoteCall('choose-directory');
    if (!directory) {
      alert("It doesn't look like you chose valid a directory. \nPlease try again.")
    } else {
      localStorage.directory = directory;
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
      console.log('TODO: actually load from server...');
      LogFile = {lines: []};
    }
  }

  function renderLogFile() {
    _.map(LogFile.lines, function (logLineObject) {
      $logHolder.append(loglineTemplate(logLineObject));
    });
    $('#page-content-container').scrollTop($('#page-content-container').height() * 2);
  }

  function addLine(logLineObject) {
    LogFile.lines.push(logLineObject);
    $logHolder.append(loglineTemplate(logLineObject));
  }

  function getAndClearLogline() {
    var line = $('#main-input').val();
    $('#main-input').val('');
    return line;
  }

  function saveFile() {
    if (local_mode) {
      localStorage.localLogFile = JSON.stringify(LogFile);
    } else {
      console.log('should write to: ' + localStorage.directory + '/' + localStorage.file);
    }
  }

  $('#main-input').keydown(function (e) {
    if (e.which === 13) {
      var time = moment();
      addLine({
        text: {
          type: 'text',
          line: getAndClearLogline()
        },
        time: time.format("ddd MMM DD YYYY, h:mm a"),
        timestamp: time.valueOf()
      });
      saveFile();
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
    if (document.activeElement.id !== 'filename' && $('#filename').text() != 'untitlted_log_file') {
      local_mode = false;
      localStorage.file = $(this).text();
      $('#warning').addClass('hidden');
      saveFile();
    }
  });


});