var app = require('app'),
  fs = require('fs'),
  ipc = require('ipc'),
  spawn = require('child_process').spawn,
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

ipc.on('check-file', function(event, data) {
  console.log('checking:  ' + path.join(data.directory, data.file + '.yaml'));
  fs.exists(path.join(data.directory, data.file + '.yaml'), function (exists) {
    var status = "OK";
    if (exists) {
      status = "ERROR";
    }
    event.returnValue = status;
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
      if (directoryListing.length !== 0) {
        if (!_.isUndefined(directoryListing[0])) {
          event.returnValue = directoryListing[0];
        } else {
          event.returnValue = false;
        }
      } else {
        event.returnValue = false;
      }
    } else {
      event.returnValue = false;
    }
  });
});

ipc.on('choose-file', function(event, data) {
  dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [{name: 'yaml files', extensions: ['yaml']}]
  }, function (filePaths) {
    var pathObject = path.parse(filePaths[0]);
    event.returnValue = {
      file: pathObject.name,
      directory: pathObject.dir
    };
  });
});

ipc.on('open-link', function(event, data) {
  spawn('open', [data.url]);
});

app.on('window-all-closed', function() {
  app.quit();
});

app.on('ready', function() {
  mainWindow = new BrowserWindow({
    'width': 1240,
    'height': 780,
    'min-width': 1000,
    'min-height': 600
  });
  mainWindow.loadUrl('file://' + __dirname + '/renderer/renderer.html');
  mainWindow.on('closed', function() {
    mainWindow = null;
  });
});