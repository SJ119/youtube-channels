var gulp = require('gulp'),
    del = require('del'),
    concat = require('gulp-concat'),
    uglify = require('gulp-uglify'),
    minifyCSS = require('gulp-minify-css'),
    plumber = require('gulp-plumber'),
    browserSync = require('browser-sync').create(),
    reload = browserSync.reload,
    rename = require('gulp-rename'),
    deploy = require('gulp-gh-pages');

/**
 * Push build to gh-pages
 */
gulp.task('deploy', function() {
    return gulp.src("./dist/**/*")
        .pipe(deploy());
});

// Clean task
// Clears and removes generated files
gulp.task('clean', function() {
    del([
        'dist'
    ]);
});

// Copy Lib Task
// Copies required library files into distribution directory
gulp.task('copy-lib', function() {
    gulp.src([
            'bower_components/jquery/dist/jquery.js',
            'bower_components/d3/d3.js',
            'bower_components/flexboxgrid/dist/flexboxgrid.css'
        ])
        .pipe(gulp.dest('dist/lib'));
});

// Copy HTML Task
// Copies required HTML files into distribution directory
gulp.task('copy-html', function() {
    gulp.src([
            'src/html/*'
        ])
        .pipe(gulp.dest('dist'));
    gulp.src([
            'assets/*'
        ])
        .pipe(gulp.dest('dist/assets'));
});

// Copy JS Task
// Copies required javascript files into distribution directory 
// Concatenates the JS files first
// Uglifies/compresses as a .min.js file as well
gulp.task('copy-js', function() {
    gulp.src([
            'src/js/*.js'
        ])
        .pipe(plumber())
        .pipe(concat('youtubeld.js'))
        .pipe(gulp.dest('dist/js'))
        .pipe(uglify())
        .pipe(rename({
            extname: '.min.js'
        }))
        .pipe(gulp.dest('dist/js'));
});

// Copy CSS Task
// Copies required SCSS files into distribution directory
// Precomipler generates the necessary .css files
// Creates a minified version .min.css file as well
gulp.task('copy-css', function() {
    // Copies and generates main .css file
    gulp.src([
            'src/css/*.css'
        ])
        .pipe(plumber())
        .pipe(concat('youtubeld.css'))
        .pipe(gulp.dest('dist/css'))
        .pipe(minifyCSS())
        .pipe(rename({
            extname: '.min.css'
        }))
        .pipe(gulp.dest('dist/css'));
});

gulp.task('html', ['copy-html'], function() {
    browserSync.reload();
});

gulp.task('js', ['copy-js'], function() {
    browserSync.reload();
});

gulp.task('css', ['copy-css'], function() {
    browserSync.reload();
});

// Copy Task
// Copies necessary files to distribution directory
gulp.task('copy', ['copy-lib', 'copy-html', 'copy-js', 'copy-css']);

// Reload all Browsers
gulp.task('reload', function() {
    browserSync.reload();
});

// Watch Task
// Watches for any changes in the src folder and rebuilds distribution folder
gulp.task('watch', function() {
    browserSync.init({
        server: {
            injectChanges: true,
            baseDir: 'dist'
        }
    });

    gulp.watch(['src/html/**/*.html'], ['html']);
    gulp.watch(['src/js/**/*.js'], ['js']);
    gulp.watch(['src/css/*.css'], ['css']);

    //browserSync.stream();

});

gulp.task('default', ['copy', 'watch']);