var app = require('app'),
  fs = require('fs'),
  ipc = require('ipc'),
  yaml = require('js-yaml'),
  BrowserWindow = require('browser-window'),
  dialog = require('dialog'),
  DEBUG = false,
  userDataPath = app.getPath('userData'),
  currentFilePath = userDataPath + '/example_log.yaml',
  currentLogFileObject = yaml.safeLoad(fs.readFileSync(currentFilePath, 'utf8'));

// Report crashes to our server.
require('crash-reporter').start();

// Keep a global reference of the window object, to stop GCing.
var mainWindow = null;

app.on('window-all-closed', function() {
  if (process.platform != 'darwin') {
    app.quit();
  }
});

ipc.on('send_data', function(event, data) {
  currentLogFileObject.lines.push(data);
  // TODO: write to disk
  event.returnValue = {'status': 'OK'};
});

ipc.on('get_data', function(event, arg) {
  if (arg == 'logfile') {
    var returnValue = currentLogFileObject;
  }
  event.returnValue = returnValue;
});

app.on('ready', function() {
  mainWindow = new BrowserWindow({width: 1240, height: 780, frame: false});
  mainWindow.loadUrl('file://' + __dirname + '/index.html');
  if (DEBUG) {
    mainWindow.openDevTools();
  }

  // //open a file
  // dialog.showOpenDialog(mainWindow, {
  //   properties: ['openFile'],
  //   filters: [{ name: 'readme docs', extensions: ['md']}]
  // }, function (fileName) {
  //   console.log(fileName);
  // });

  mainWindow.on('closed', function() {
    //setting mainWindow to null releases it to be GC'd and the application will close
    mainWindow = null;
  });
});