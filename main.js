var app = require('app'),
  ipc = require('ipc'),
  BrowserWindow = require('browser-window'),
  dialog = require('dialog'),
  DEBUG = false,
  userDataPath = app.getPath('userData');

// Report crashes to our server.
require('crash-reporter').start();

// Keep a global reference of the window object, to stop GCing.
var mainWindow = null;

app.on('window-all-closed', function() {
  if (process.platform != 'darwin') {
    app.quit();
  }
});


// Interactions with DOM
ipc.on('data_transmission', function(event, arg) {
  console.log(arg);
  event.returnValue = arg;
});


app.on('ready', function() {

  mainWindow = new BrowserWindow({width: 1240, height: 780});
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