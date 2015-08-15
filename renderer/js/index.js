define(function (require) {
  var $ = require('jquery'),
    moment = require('moment')
    _ = require('underscore'),
    yaml = require('yaml'),
    Handlebars = require('handlebars'),
    loglineTemplate = Handlebars.compile($("#logline-template").html()),
    $logHolder = $('#log-holder'),
    LogFile = {lines: []},
    supportedLanguages = hljs.listLanguages();

  Handlebars.registerHelper('breaklines', function(text) {
    text = Handlebars.Utils.escapeExpression(text);
    text = text.replace(/(\r\n|\n|\r)/gm, '<br>');
    return new Handlebars.SafeString(text);
  });


  ensureDirectory();
  loadFile();
  renderLogFile();
  updateView();
  readyForUser();

  function updateView() {
    if (_.isUndefined(localStorage.directory)) {
      $('#directions').removeClass('hidden');
      $('#main-input').prop('disabled', true);
    } else {
      $('#directions').addClass('hidden');
    }
    if (_.isUndefined(localStorage.file)) {
      $('#warning').removeClass('hidden');
    } else {
      $('#filename').text(localStorage.file);
      $('#warning').addClass('hidden');
    }
    if (!_.isUndefined(localStorage.directory) && !_.isUndefined(localStorage.file)) {
      $('#warning').removeClass('hidden');
      $('#directory').text(localStorage.directory + '/' + localStorage.file + '.yaml');
      $('#main-input').removeAttr('disabled');
      $('#warning').addClass('hidden');
    }
  }

  function ensureDirectory() {
    if (_.isUndefined(localStorage.directory)) {
      $('#choose-directory').click(chooseDirectory);
    }
  }

  function readyForUser() {
    $('#main-input').focus();
    $('#directory').removeClass('hidden');
    $('#filename').removeClass('hidden');
  }

  function chooseDirectory() {
    var directory = remoteCall('choose-directory');
    if (!directory) {
      alert("It doesn't look like you chose valid a directory. \nPlease try again.")
    } else {
      localStorage.directory = directory;
      updateView();
    }
  }

  function loadFile() {
    if (_.isUndefined(localStorage.directory) || _.isUndefined(localStorage.file)) {
      if (_.isUndefined(localStorage.localLogFile)) {
        localStorage.localLogFile = JSON.stringify({lines: []});
      }
      LogFile = JSON.parse(localStorage.localLogFile);
    } else {
      LogFile = yaml.load(ipc.sendSync('load-file', {
        'directory': localStorage.directory,
        'file': localStorage.file
      }));
    }
  }

  function renderLogFile() {
    _.map(LogFile.lines, function (logLineObject) {
      $logHolder.append(loglineTemplate(logLineObject));
    });
    $('pre code').each(function(i, block) {
      hljs.highlightBlock(block);
    });
    scrollToBottom();
  }

  function scrollToBottom() {
    $('#page-content-container').scrollTop($('#page-content-container').height() * 2);
  }

  function addLine(logLineObject) {
    LogFile.lines.push(logLineObject);
    $logHolder.append(loglineTemplate(logLineObject));
    scrollToBottom();
    $('pre code').each(function(i, block) {
      hljs.highlightBlock(block);
    });
  }

  function saveFile() {
    console.log('saving file with conditions:    ' + localStorage.file + '     ' + localStorage.directory);
    if (_.isUndefined(localStorage.directory) || _.isUndefined(localStorage.file)) {
      localStorage.localLogFile = JSON.stringify(LogFile);
    } else {
      var response = ipc.sendSync('save-file', {
        'directory': localStorage.directory,
        'file': localStorage.file,
        'log': yaml.safeDump(LogFile)
      });
    }
  }

  function parseLineToObject(line) {
    var languagesDetected = _.filter(supportedLanguages, function(language) {
      return line.startsWith('/' + language + ' ');
    });
    if (!_.isEmpty(languagesDetected)) {
      var toSlice = '/' + _.first(languagesDetected) + ' ';
      line = line.slice(toSlice.length);
      return {
        'code': true,
        'language': languagesDetected,
        'line': line
      }
    } else if (line.startsWith('/code')) {
      line = line.slice('/code '.length);
      return {
        'code': true,
        'language': 'javascript',
        'line': line
      }
    }
    return {
      'code': false,
      'line': line
    }
  }

  $('#main-input').keydown(function (e) {
    if (e.which === 13) {
      var time = moment();
      var line = $('#main-input').val();
      addLine({
        text: parseLineToObject(line),
        time: time.format("ddd MMM DD YYYY, h:mm a"),
        timestamp: time.valueOf()
      });
      saveFile();
      $('#main-input').val('');
      return false;
    }
  });

  $('#filename').keypress(function (event) {
    if (event.which !== 0) {
      var character = String.fromCharCode(event.which);
      if (event.which === 13) {
        $('#change-directory').focus();
      }
      return !/[^a-zA-Z0-9_-]/.test(character);
    }
  });
  $('#filename').on('focusout', function (event) {
    if (document.activeElement.id !== 'filename') {
      localStorage.file = $('#filename').text();
      updateView();
      saveFile();
    }
  });


});