var app = require('app'),
  fs = require('fs'),
  ipc = require('ipc'),
  yaml = require('js-yaml'),
  _ = require('underscore'),
  path = require('path'),
  BrowserWindow = require('browser-window'),
  dialog = require('dialog'),
  reporter = require('crash-reporter'),
  userDataPath = app.getPath('userData'),
  configFilePath = userDataPath + '/config.json',
  config,
  currentFilePath = userDataPath + '/example_log.yaml',
  currentLogFileObject,
  mainWindow = null; // Keep a global reference of the window object, to stop GCing.

// Report crashes to our server.
reporter.start();

// If the config file doesn't exist we need to write it.
if (!fs.existsSync(configFilePath)) {
  fs.writeFileSync(configFilePath, JSON.stringify({}));
}
config = require(configFilePath);


ipc.on('send_data', function(event, data) {
  if (data.endpoint === 'addLogLine') {
    currentLogFileObject.lines.push(data.body);
    fs.writeFileSync(currentFilePath, yaml.safeDump(currentLogFileObject));
    event.returnValue = {
      'status': 'OK'
    };
  } else if (data.endpoint === 'addManyLogLine') {
    currentLogFileObject.lines = data.body;
    fs.writeFileSync(currentFilePath, yaml.safeDump(currentLogFileObject));
    event.returnValue = {
      'status': 'OK'
    };
  } else {
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
    currentLogFileObject = yaml.safeLoad(fs.readFileSync(currentFilePath, 'utf8'));
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