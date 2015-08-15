var app = require('app'),
  fs = require('fs'),
  ipc = require('ipc'),
  _ = require('underscore'),
  path = require('path'),
  BrowserWindow = require('browser-window'),
  dialog = require('dialog'),
  reporter = require('crash-reporter'),
  LogFile = {lines: []},
  mainWindow = null;

// Report crashes to our server.
reporter.start();

ipc.on('save-file', function(event, data) {
  fs.writeFile(path.join(data.directory, data.file + '.yaml'), data.log, function (err) {
    if (err) throw err;
    event.returnValue = 'OK';
  });
});

ipc.on('load-file', function(event, data) {
  fs.readFile(path.join(data.directory, data.file + '.yaml'), 'utf8', function (err, file) {
    if (err) throw err;
    event.returnValue = file;
  });
});


ipc.on('choose-directory', function(event, data) {
  dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    filters: []
  }, function (directoryListing) {
    if (!_.isUndefined(directoryListing)) {
      if (!_.isUndefined(directoryListing[0])) {
        event.returnValue = directoryListing[0];
      } else {
        event.returnValue = false;
      }
    } else {
      event.returnValue = false;
    }
  });
});

app.on('window-all-closed', function() {
  app.quit();
});

app.on('ready', function() {
  mainWindow = new BrowserWindow({
    width: 1240,
    height: 780
  });
  mainWindow.loadUrl('file://' + __dirname + '/renderer/renderer.html');
  mainWindow.on('closed', function() {
    mainWindow = null;
  });
});