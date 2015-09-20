requirejs.config({
    baseUrl: 'js',
    paths: {
      components: 'components',
      jquery: 'jquery-2.1.4.min',
      handlebars: 'handlebars-v3.0.3',
      react: 'react.min',
      moment: 'moment',
      underscore: 'underscore.min',
      yaml: 'js-yaml',
      highlight: 'highlight.pack'
    },
    shim: {
      'jquery': 'jquery-2.1.4.min',
      'react': 'react.min',
      'highlight': 'highlight.pack',
      'moment': 'moment',
      'underscore': 'underscore.min',
      'yaml': 'js-yaml',
      'handlebars': 'handlebars-v3.0.3',
      components: {
        deps: ['jquery', 'react', 'yaml', 'moment', 'underscore', 'highlight']
      }
    }
});

requirejs([
  'jquery',
  'react',
  'highlight',
  'handlebars',
  'underscore',
  'yaml',
  'moment',
  'components'
]);