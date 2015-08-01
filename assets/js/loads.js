requirejs.config({
    baseUrl: jsAssetsDirectory,
    shim: {
      'jquery': 'jquery-2.1.4.min',
      'material': 'material.min'
    }
});

requirejs([
  'jquery-2.1.4.min',
  'material.min',
  'index'
]);