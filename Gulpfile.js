'use strict';

var gulp = require('gulp'),
    concat = require('gulp-concat'),
    rename = require('gulp-rename'),
    sass = require('gulp-ruby-sass'),
    autoprefixer = require('gulp-autoprefixer'),
    gutil = require('gulp-util'),
    path = require('path'),
    $ = require('gulp-load-plugins')(),
    sourcemaps = require('gulp-sourcemaps'),
    uglify = require('gulp-uglify');


/**
 * SASS task
 */
gulp.task('sass', function () {
    return sass('./public/src/sass/style.scss', {
            style: 'expanded'
        })
        .pipe(autoprefixer('last 2 version'))
        .pipe(gulp.dest('./public/dist/css'));
});

/**
 *Uglify js files and compress them in 1 bundle
 */
gulp.task('compress', function () {
    return gulp.src('./public/src/js/*.js')
        .pipe(concat('bundle.js'))
        .pipe(gulp.dest('./public/dist/js'))
        .pipe(rename('bundle.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest('./public/dist/js'));
});


/**
 * Watch task
 */
gulp.task("watch", function () {
    gulp.watch("./public/src/sass/*.scss", ["sass"]);
});

gulp.task('default', ['compress', 'sass'], function () {});
