define(function (require) {
  var $ = require('jquery'),
    moment = require('moment')
    _ = require('underscore'),
    yaml = require('yaml'),
    Handlebars = require('handlebars'),
    loglineTemplate = Handlebars.compile($("#logline-template").html()),
    $logHolder = $('#log-holder'),
    LogFile = {lines: []},
    supportedLanguages = hljs.listLanguages(),
    Notifications = {
      SavedToNewFile: "Saved all log lines to new file"
    };

  Handlebars.registerHelper('encodefordisplay', function(text) {
    text = Handlebars.Utils.escapeExpression(text);
    text = text.replace(/(\r\n|\n|\r)/gm, '<br>');
    text = text.replace(/(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim, '<a href="$1" target="_blank">$1</a>');
    text = text.replace(/(^|[^\/])(www\.[\S]+(\b|$))/gim, '$1<a href="http://$2" target="_blank">$2</a>');
    return new Handlebars.SafeString(text);
  });

  ensureDirectory();
  loadFile();
  renderLogFile();
  updateView();
  readyForUser();

  function loadImg() {
    var img = document.createElement('img');
    img.setAttribute('src', path.join(__dirname, 'img/icon.png'));
    img.setAttribute('class', 'logo');
    $('#logo-holder').append(img).removeClass('hidden');
  }
  loadImg();

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

  function showNotification(notification) {
    $('#notification').text(notification);
    $('#notification').removeClass('hidden');
    setTimeout(function() {
      $('#notification').addClass('hidden');
    }, 5000);
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

  function alertChooseValidDirectory() {
    alert("It doesn't look like you chose valid a directory. \nPlease try again.");
  }

  function confirmOverwrite(file, directory) {
    return confirm("This file " + path.join(directory, file + ".yaml") + " already exists! \nOverwrite this file?");
  }

  function chooseDirectory() {
    var directory = remoteCall('choose-directory');
    if (!directory) {
      alertChooseValidDirectory();
    } else {
      localStorage.directory = directory;
      updateView();
    }
  }

  function changeDirectory() {
    var directory = remoteCall('choose-directory');
    if (!directory) {
      alertChooseValidDirectory();
    } else {
      checkFilenameAvailability(localStorage.file, function (response) {
        if (response !== 'OK') {
          if (confirmOverwrite(directory, localStorage.file)) {
            save();
          } else {
            $('#filename').focus();
          }
        } else {
          save();
        }
        function save() {
          localStorage.directory = directory;
          updateView();
          saveFile(function(response) {
            if (response === "OK") {
              showNotification(Notifications.SavedToNewFile);
            }
          });
        }
      });
    }
  }

  function loadFile() {
    if (_.isUndefined(localStorage.directory) || _.isUndefined(localStorage.file)) {
      if (_.isUndefined(localStorage.localLogFile)) {
        localStorage.localLogFile = JSON.stringify({lines: []});
      }
      LogFile = JSON.parse(localStorage.localLogFile);
    } else {
      LogFile = yaml.safeLoad(ipc.sendSync('load-file', {
        'directory': localStorage.directory,
        'file': localStorage.file
      }));
      _.map(LogFile.lines, function(log, index) {
        var line = log.text.line;
        var splitOnEndings = line.split('\n');
        var filtered = _.filter(splitOnEndings, function(currentLine) {
          return currentLine != "";
        });
        if (filtered.length >= Math.round(splitOnEndings.length / 2) - 3 && filtered.length <= Math.round(splitOnEndings.length / 2) + 3) {
          LogFile.lines[index].text.line = filtered.join('\n');
        }
      });
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

  function saveFile(callback) {
    console.log('saving file with conditions:    ' + localStorage.file + '     ' + localStorage.directory);
    var response;
    if (_.isUndefined(localStorage.directory) || _.isUndefined(localStorage.file)) {
      localStorage.localLogFile = JSON.stringify(LogFile);
      response = "OK";
    } else {
      response = ipc.sendSync('save-file', {
        'directory': localStorage.directory,
        'file': localStorage.file,
        'log': yaml.safeDump(LogFile)
      });
    }
    if (callback) {
      callback(response);
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

  function checkFilenameAvailability(filename, callback) {
    var response = ipc.sendSync('check-file', {
      'directory': localStorage.directory,
      'file': filename
    });
    callback(response);
  }

  function newFile() {
    $('#log-holder .logline').each(function() {
      $(this).remove();
    });
    $('#filename').focus();
    $('#filename').text('untitled_log_file');
    $('#main-input').prop('disabled', true);
    localStorage.removeItem('file');
    LogFile = {lines: []};
    updateView();
  }

  $('#main-input').keydown(function (e) {
    if (e.which === 13 && !e.shiftKey) {
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

  $("#change-directory").click(changeDirectory);

  $("#new").click(newFile);

  // prevent tab from being inserted into the #filename element
  $('#filename').keydown(function(e) {
    if (e.which === 9) {
      e.preventDefault();
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
      var newFilename = $('#filename').text();
      if (localStorage.file !== newFilename && newFilename !== 'untitled_log_file') {
        checkFilenameAvailability($('#filename').text(), function (response) {
          if (response !== 'OK') {
            if (confirmOverwrite(localStorage.directory, $('#filename').text())) {
              save();
            } else {
              $('#filename').focus();
            }
          } else {
            save();
          }
          function save() {
            localStorage.file = $('#filename').text();
            updateView();
            saveFile(function(response) {
              if (response === "OK") {
                showNotification(Notifications.SavedToNewFile);
              }
            });
          }
        });
      }
    }
  });

});