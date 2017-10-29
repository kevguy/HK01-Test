var shell = require('shelljs');

shell.cp('-R', 'src/views', 'dist/');
shell.cp('-R', 'src/locales', 'dist/');
shell.cp('-R', 'src/public/js/', 'dist/public/');
shell.cp('-R', 'src/public/favicon.ico', 'dist/public/');
