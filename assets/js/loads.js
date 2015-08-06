requirejs.config({
    baseUrl: jsAssetsDirectory,
    paths: {
      index: 'index',
      jquery: 'jquery-2.1.4.min',
      handlebars: 'handlebars-v3.0.3',
      moment: 'moment',
      yaml: 'js-yaml.min'
    },
    shim: {
      'jquery': 'jquery-2.1.4.min',
      'moment': 'moment',
      'yaml': 'js-yaml.min',
      'handlebars': 'handlebars-v3.0.3',
      index: {
        deps: ['jquery', 'yaml', 'moment']
      }
    }
});

requirejs([
  'jquery',
  'handlebars',
  'yaml',
  'moment',
  'index'
]);