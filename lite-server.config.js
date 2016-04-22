'use strict';

module.exports = {
    port: 8000,
    files: ['./example/*.html', './src/**/*.{css,js}', './node_modules/**/*.{js}'],
    server: {
        baseDir: ['example', 'src', 'node_modules']
    }
};