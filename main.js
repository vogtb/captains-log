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


ipc.on('send_data', function(event, data) {
  switch (data.endpoint) {
    case 'addLogLine':
      LogFile.lines.push(data.body.line);
      fs.writeFileSync(path.join(data.body.directory, data.body.file), yaml.safeDump(LogFile));
      event.returnValue = {
        'status': 'OK'
      };
    case 'addManyLogLine':
      LogFile.lines = data.body.lines;
      fs.writeFileSync(path.join(data.body.directory, data.body.file), yaml.safeDump(LogFile));
      event.returnValue = {
        'status': 'OK'
      };
    case 'changeFileName':
      fs.writeFileSync(path.join(data.body.directory, data.body.file + 'yaml'), yaml.safeDump(LogFile));
      event.returnValue = {
        'status': 'OK'
      };
    default:
      event.returnValue = {
        'status': 'ERROR',
        'message': 'Undefined endpoint.'
      };
  }
});

ipc.on('get_data', function(event, data) {
  if (data.endpoint === 'loadFile') {
    //ensuring the yaml file exists
    if (!fs.existsSync(path.join(data.body.directory, data.body.file +'.yaml'))) {
      fs.writeFileSync(path.join(data.body.directory, data.body.file +'.yaml'), yaml.safeDump({lines: []}));
    }
    currentFilePath = path.join(data.body.directory, data.body.file + '.yaml');
    LogFile = yaml.safeLoad(fs.readFileSync(currentFilePath, 'utf8'));
    event.returnValue = {
      status: 'OK',
      body: LogFile
    };
  } else {
    event.returnValue = {
      'status': 'ERROR',
      'message': 'Undefined endpoint.'
    };
  }
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
  mainWindow.loadUrl('file://' + __dirname + '/index.html');
  mainWindow.on('closed', function() {
    mainWindow = null;
  });
});