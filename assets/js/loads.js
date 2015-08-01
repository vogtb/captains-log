requirejs.config({
    baseUrl: jsAssetsDirectory,
    paths: {
      index: 'index',
      jquery: 'jquery-2.1.4.min'
    },
    shim: {
      'jquery': 'jquery-2.1.4.min',
      index: {
        deps: ['jquery']
      }
    }
});

requirejs([
  'jquery',
  'index'
]);