requirejs.config({
    baseUrl: jsAssetsDirectory,
    paths: {
      index: 'index',
      jquery: 'jquery-2.1.4.min',
      handlebars: 'handlebars-v3.0.3',
      moment: 'moment'
    },
    shim: {
      'jquery': 'jquery-2.1.4.min',
      'moment': 'moment',
      'handlebars': 'handlebars-v3.0.3',
      index: {
        deps: ['jquery']
      }
    }
});

requirejs([
  'jquery',
  'handlebars',
  'moment',
  'index'
]);