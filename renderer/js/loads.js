requirejs.config({
    baseUrl: 'js',
    paths: {
      components: 'components',
      utils: 'utils',
      react: 'react.min',
      moment: 'moment',
      index: 'index',
      underscore: 'underscore.min',
      yaml: 'js-yaml',
      highlight: 'highlight.pack'
    },
    shim: {
      'react': 'react.min',
      'highlight': 'highlight.pack',
      'moment': 'moment',
      'utils': 'utils',
      'underscore': 'underscore.min',
      'yaml': 'js-yaml',
      components: {
        deps: ['react', 'utils', 'yaml', 'moment', 'underscore', 'highlight']
      },
      'index': {
        deps: ['components', 'react', 'utils', 'yaml', 'moment', 'underscore', 'highlight']
      },
    }
});

requirejs([
  'index',
  'components',
  'react',
  'utils',
  'highlight',
  'underscore',
  'yaml',
  'moment'
]);