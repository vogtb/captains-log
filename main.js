var app = require('app'),
  fs = require('fs'),
  ipc = require('ipc'),
  yaml = require('js-yaml'),
  _ = require('underscore'),
  path = require('path'),
  BrowserWindow = require('browser-window'),
  dialog = require('dialog'),
  reporter = require('crash-reporter'),
  LogFile = {lines: []},
  mainWindow = null; // Keep a global reference of the window object, to stop GCing.

// Report crashes to our server.
reporter.start();


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
  mainWindow.loadUrl('file://' + __dirname + '/index.html');
  mainWindow.on('closed', function() {
    mainWindow = null;
  });
});