var app = require('app'),
  fs = require('fs'),
  ipc = require('ipc'),
  yaml = require('js-yaml'),
  _ = require('underscore'),
  BrowserWindow = require('browser-window'),
  dialog = require('dialog'),
  reporter = require('crash-reporter'),
  userDataPath = app.getPath('userData'),
  configFilePath = userDataPath + '/config.json',
  config,
  currentFilePath = userDataPath + '/example_log.yaml',
  currentLogFileObject = yaml.safeLoad(fs.readFileSync(currentFilePath, 'utf8')),
  mainWindow = null; // Keep a global reference of the window object, to stop GCing.

// Report crashes to our server.
reporter.start();

// If the config file doesn't exist we need to write it.
if (!fs.existsSync(configFilePath)) {
  fs.writeFileSync(configFilePath, JSON.stringify({
    logDirectory: false
  }));
}
config = require(configFilePath);


ipc.on('send_data', function(event, data) {
  if (data.endpoint === 'addLogLine') {
    currentLogFileObject.lines.push(data.body);
    fs.writeFileSync(currentFilePath, yaml.safeDump(currentLogFileObject));
    event.returnValue = {'status': 'OK'}; // TODO: do better error checking.
  } else {
    event.returnValue = {
      'status': 'ERROR',
      'message': 'Undefined endpoint.'
    };
  }
});

ipc.on('get_data', function(event, data) {
  if (data.endpoint === 'logfile') {
    event.returnValue = {
      status: 'OK',
      body: currentLogFileObject
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
  if (process.platform != 'darwin') {
    app.quit();
  }
});

app.on('ready', function() {
  mainWindow = new BrowserWindow({
    width: 1240,
    height: 780,
    frame: false
  });
  mainWindow.loadUrl('file://' + __dirname + '/index.html');

  mainWindow.on('closed', function() {
    mainWindow = null; //setting mainWindow to null releases it to be GC'd and the application will close
  });
});