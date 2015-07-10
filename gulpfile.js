/**
 *      ES6-AngularJS-TwitterBootstrap-Gulp Starter
 *      Copyright 2014-2015 Hiram Software
 *      See https://github.com/hiramsoft/es6-ng-twbs-gulp-start for more information
 *
 *      This is the file that builds your site based on Gulp
 *      http://gulpjs.com/
 *
 * Q:   Why doesn't this gulpfile use require-dir as shown in the recipe
 *      https://github.com/gulpjs/gulp/blob/master/docs/recipes/using-external-config-file.md
 *
 * A1:  As a starter, it is important to support your configuration.
 *      require-dir does not yet support passing in parameters
 *      https://github.com/aseemk/requireDir/issues/15
 *
 * A2:  As a practical matter, the gulpfile will be updated
 *      while downstream projects will have thrown away the rest.
 *      Keeping everything in one gulpfile makes it easier to
 *      copy the latest version into your downstream project.
 *
 * A3:  It's not yet clear which parts of this code can or should
 *      be pulled out into separate modules.
 **/

////////////////////////////////////////
//////// Dependencies
////////////////////////////////////////

// Generic dependencies
var _ = require('lodash');
var Promise = require('bluebird');
var marked = require('marked');
var moment = require('moment');
var File = require('vinyl');

// Gulp-specific

var gulp = require('gulp');
// through2 is used for creating local pipeline implementations
var through = require('through2');
var clean = require('gulp-clean');
var less = require('gulp-less');
var sass = require('gulp-sass');
var path = require('path');
var concat = require('gulp-concat');
var sourcemaps = require('gulp-sourcemaps');
var plumber = require('gulp-plumber');
var minifyCSS = require('gulp-minify-css');
var rename = require("gulp-rename");
var shell = require('gulp-shell');
var uglify = require('gulp-uglify');
var revision = require('git-rev');
var swig = require('gulp-swig');
var gls = require('gulp-live-server');
var concatCss = require('gulp-concat-css');
var sizereport = require('gulp-sizereport');
var frontMatter = require('gulp-front-matter');
var markedTransform = require('gulp-marked').fileTransform;
var insert = require('gulp-insert');



////////////////////////////////////////
//////// Configuration
////////////////////////////////////////

//////// Base directory of your source
var baseSrcPath = "src";
var baseMainPath = baseSrcPath + "/main";
//////// Base directory of your output
var baseDestPath = "dist";
//////// Folder where intermediate output is stored
var interOutput = "target";

//////// How to call jspm bundle-sfx
var jspmBundleSfx = [
    {
        id: "viewer", // the id to make available as a swig template variable. prefixed with 'js', e.g. 'jsmain'
        in: "viewer/viewer.js", // the input file in
        out: "viewer" // the output file (exclude the js extension)
    },
    {
        id: "admin", // the id to make available as a swig template variable. prefixed with 'js', e.g. 'jsmain'
        in: "admin/bootstrap.js", // the input file in
        out: "admin" // the output file (exclude the js extension)
    }
];

//////// The actual bundle-sfx calls
// You may have preferences, which is why this is here
var bundleJspmTasks = [];
for(var i in jspmBundleSfx){
    var jspm = jspmBundleSfx[i];
    bundleJspmTasks.push(
        'jspm bundle-sfx ' + jspm.in + ' ' + interOutput + "/" + jspm.out + ".js" // bundle-sfx does not yet minify
    );
}

var fontsSrc = [baseMainPath + "/less/**/fonts/*", baseMainPath + "/scss/**/fonts/*"];
var fontsDest = baseDestPath + "/fonts";

// Each entry will concatenate all style sources into one output
var styleBundles = [
    {
        id: "all", // the id to make available as a swig template variable. prefixed with 'css', e.g. 'cssall',
        lessIn : [baseMainPath + '/less/app.less'], //////// Entry point for LESS
        sassIn : [baseMainPath + '/scss/app.scss'], //////// Entry point for SCSS
        cssIn : [baseMainPath + '/css/**/*.css'], //////// Uncompiled legacy CSS to include
        out : "all" // Filename for compiled css (exclude the css extension)
    }
];

// For watching only
var styleSrc = [];
for(var i=0;i<styleBundles.length;i++){
    var bundle = styleBundles[i];
    styleSrc = _.union(styleSrc, bundle.lessIn, bundle.sassIn, bundle.cssIn);
}

var cssDest = baseDestPath;

//////// ES5 source code
var jsSrc = baseMainPath + '/js/**/*.js';
var jsDest = baseDestPath;

var es6Src = [baseMainPath + '/es6/**/*.js', baseMainPath + '/es6/**/*.es6'];

//////// Note that '_layout' is excluded
var layoutDir = "_layout";

var htmlSrc = ['!' + baseMainPath + '/html/{' + layoutDir + ',' + layoutDir + '/**}', baseMainPath + '/html/**/*.html'];
var htmlDest = baseDestPath;

//////// Markdown support
var mdSrc = [baseMainPath + "/markdown/**/*.md", baseMainPath + "/markdown/**/*.markdown"];
var mdDest = baseDestPath;

var blogPageSize = 10;
// How the displayDate is formatted
var blogDateFormat = "dddd, LL";
// How to group posts (YYYY-MM says group posts by year-month combinations)
//var blogDateGrouping = "YYYY-MM";
// Use YYYY to group by years only
var blogDateGrouping = "YYYY";
// How the group titles get formatted
//var blogDateGroupingTitle = "MMMM YYYY";
// Use YYYY for years only
var blogDateGroupingTitle = "YYYY";

//////// See the description in the readme on generated
var generatedSrc = [baseMainPath + "/generated/**/*.html"];
var generatedDest = baseDestPath;

var staticSrc = baseMainPath + '/static/**/*';
var staticDest = baseDestPath;

var dataSrc = baseMainPath + '/data/**/*';
var dataDest = baseDestPath + '/data';

var swigOptions = {
    cache: false,
    varControls: ['%{{', '}}%']
};

var frontMatterOptions = { // optional configuration
    property: 'frontMatter', // property added to file object
    remove: true // should we remove front-matter header?
}

/**
 * Calculate the slug based on your own favorite logic
 *
 * Check out fileRecord.data for front-matter data
 * @param basename the file name without directory or extension
 * @param fileRecord the file record
 */
function calcSlug(basename, fileRecord){
    if(fileRecord.data.jekyllFilename){
        var jn = fileRecord.data.jekyllFilename;
        return jn.year + "/" + jn.month + "/" + jn.day + "/" + jn.title + ".html";
    }
    else {
        return basename;
    }
}

/**
 * Return true if you want this code to call calcSlug (see above) to calculate your slug
 *
 * The default implementation is to calculate the slug if it was not specified in the front-matter
 * @param basename
 * @param fileRecord
 * @returns {boolean}
 */
function letMeCalculateSlug(basename, fileRecord){
    return !fileRecord.data.slug || !fileRecord.data.permalink;
}

function reportChange(event){
    console.log('File ' + event.path + ' was ' + event.type + ', running tasks...');
}

function errorHandler (error) {
    console.log(error.toString());
    this.emit('end');
}

/**
 * Site context provides a listing of all the other content files
 * in a given static site.
 *
 * It is most useful for generating blog or category indexes.
 *
 * Yes, it is a global variable... :)
 *
 * siteContext.files = [] all HTML + MD files (includes partial templates from NG)
 * siteContext.posts = [] all HTML + MD files with front matter
 * siteContext.categories[categoryName] = [] all HTML + MD files whose front matter includes categoryName
 * siteContext.tags[tagName] = [] all HTML + MD files whose front matter includes tagName
 */
var scWrapper = {};

////////////////////////////////////////
//////// Build tasks (i.e. take input files and transform)
////////////////////////////////////////

/**
 * Previews markdown and HTML pages to generate an index
 *
 * This is extra complicated because of the inline latch...
 * All of the files have to scanned before we can generate
 * summaries for each file because the summaries may inlcude
 * links to each other...
 *
 * I want to go through and redo this one day... :)
 */
gulp.task('build-markdown-index', function(){
    // reset context during new run
    scWrapper.siteContext = {
        buildDate : moment()
    };

    return new Promise(function(resolve, reject) {

        var previewState = {
            bundleFiles: [],
            acceptFile: function () {
                var self = this;
                return through.obj(function (file, enc, cb) {
                    self.bundleFiles.push(file);
                    cb(null, file);
                });
            },
            pipelineComplete: function () {
                var self = this;
                // need a virtual source
                var src = require('stream').Readable({objectMode: true});
                src.findex = 0;
                src._read = function () {
                    for (; this.findex < self.bundleFiles.length; this.findex++) {
                        this.push(self.bundleFiles[this.findex]);
                    }
                    if (this.findex >= self.bundleFiles.length) {
                        // undocumented on https://nodejs.org/api/stream.html#stream_event_data
                        // but "null" is the control signal that there is no more data in the stream...
                        this.push(null);
                    }
                };

                return src;
            }
        };

        // The first part of the pipeline previews the files
        // and is held by a latch stored inside "previewState"
        gulp.src(mdSrc)
            .pipe(frontMatter(frontMatterOptions))
            .pipe(snippet("<!-- more -->"))
            .pipe(mergeFrontMatterIntoData())
            .pipe(ignoreDrafts())
            .pipe(renameLikeJekyll())
            .pipe(addCategories())
            .pipe(buildSiteContext(scWrapper.siteContext))
            .pipe(previewState.acceptFile())
            .pipe(sink("preview"))
            .on('finish', function () {

                // the second part of the pipeline takes
                // the previewed files and generates summaries

                previewState.pipelineComplete()
                    .pipe(addSiteContext(scWrapper.siteContext))
                    .pipe(markdown({}))
                    .pipe(addSummary(scWrapper.siteContext))
                    //.pipe(reporter("5"))
                    .pipe(removeSiteContext())
                    .pipe(sink("summary"))
                    .on('finish', function () {
                        if (groupSiteContext(scWrapper.siteContext)) {
                            resolve(true);
                        } else {
                            reject("unable to group site context");
                        }
                    });
            });
    });
});

// Builds HTML files in generated folder by providing them with a collection
// Useful for building sitemaps, blog indexes, or tag (category) pages
gulp.task('build-generated', ['build-markdown-index'], function() {
    return gulp.src(generatedSrc)
        .pipe(frontMatter(frontMatterOptions))
        .pipe(mergeFrontMatterIntoData())
        .pipe(ignoreDrafts())
        .pipe(generateIndicies())
        .pipe(addGitInfo())
        .pipe(addSiteContext(scWrapper.siteContext))
        .pipe(swig({
            defaults: swigOptions
        }))
        // need to run swig a second time because summaries can have SWIG in them
        // and this means this pipeline really should be iterative
        // but there isn't an "obvious" way to do that
        .pipe(swig({
            defaults: swigOptions
        }))
        .pipe(gulp.dest(generatedDest));
});

// Copies *.html files, applies swig templates,
// and makes available variables to populate <script> and <link> tags with production URLs
gulp.task('build-html', ['build-markdown-index'], function() {
    return gulp.src(htmlSrc)
        .pipe(addGitInfo())
        .pipe(addSiteContext(scWrapper.siteContext))
        .pipe(swig({
            defaults: swigOptions
        }))
        .pipe(gulp.dest(htmlDest));
});
// Renders markdown inside markdown folder as if each file was sitting inside the the HTML directory
gulp.task('build-markdown', ['build-markdown-index'], function() {
    return gulp.src(mdSrc)
        .pipe(frontMatter(frontMatterOptions))
        .pipe(mergeFrontMatterIntoData())
        .pipe(ignoreDrafts())
        .pipe(renameLikeJekyll())
        .pipe(addCategories())
        .pipe(markdown({}))
        .pipe(applyFrontMatterLayout(layoutDir))
        .pipe(addGitInfo())
        .pipe(addSiteContext(scWrapper.siteContext))
        .pipe(swig({
            defaults: swigOptions
        }))
        .pipe(gulp.dest(mdDest));
});

// for each styleBundle (defined above)
// compiles, concatenates, and minifies all style documents into one output css file
// This is implemented using two local latches
gulp.task('build-style', function(){

    return new Promise(function(resolve, reject) {

        var bundlesComplete = 0;
        var totalBundles = styleBundles.length;

        function bundleComplete() {
            bundlesComplete++;
            if (bundlesComplete >= totalBundles) {
                resolve("done");
            }
        };

        // wrapped in a function to prevent overwriting
        function processBundle(b) {
            var bundle = _.clone(b);
            var totalLatches = 0;
            var latchCount = 0;
            if (bundle.lessIn && bundle.lessIn.length > 0) {
                totalLatches++;
            }

            if (bundle.sassIn && bundle.sassIn.length > 0) {
                totalLatches++;
            }

            if (bundle.cssIn && bundle.cssIn.length > 0) {
                totalLatches++;
            }

            var bundleState = {
                bundleFiles : [],
                acceptFile : function() {
                    var self = this;
                    return through.obj(function (file, enc, cb) {
                        self.bundleFiles.push(file);
                        cb(null, file);
                    });
                },
                pipelineComplete : function () {
                    latchCount++;
                    if (latchCount >= totalLatches) {
                        this.nextPipeline();
                    }
                },
                nextPipeline: function(){
                    var self = this;
                    // need a virtual source
                    var src = require('stream').Readable({objectMode: true});
                    src.findex = 0;
                    src._read = function (cb) {
                        for (; this.findex < self.bundleFiles.length; this.findex++) {
                            this.push(self.bundleFiles[this.findex]);
                        }
                        if(this.findex >= self.bundleFiles.length){
                            // undocumented on https://nodejs.org/api/stream.html#stream_event_data
                            // but "null" is the control signal that there is no more data in the stream...
                            this.push(null);
                        }
                    };

                    var postcss      = require('gulp-postcss');
                    var sourcemaps   = require('gulp-sourcemaps');
                    var autoprefixer = require('autoprefixer-core');

                    src.pipe(concatCss(bundle.out + buildCssExt))
                        .pipe(sourcemaps.init())
                        .pipe(postcss([ autoprefixer({ browsers: ['last 2 version'] }) ]))
                        .pipe(sourcemaps.write('.'))
                        .pipe(rename(function (path) {
                            path.basename = bundle.out;
                            path.extname = buildCssExt;
                        }))
                        .pipe(gulp.dest(cssDest))
                        .on('end', function () {
                            bundleComplete();
                        });
                }
            };

            if (bundle.lessIn && bundle.lessIn.length > 0) {
                gulp.src(bundle.lessIn)
                    .pipe(less({
                        paths: [path.join(__dirname, 'less', 'includes')]
                    }))
                    .pipe(bundleState.acceptFile())
                    .on('finish', function () {
                        bundleState.pipelineComplete();
                    })
            }

            if (bundle.sassIn && bundle.sassIn.length > 0) {
                gulp.src(bundle.sassIn)
                    .pipe(sass())
                    .pipe(bundleState.acceptFile())
                    .on('finish', function () {
                        bundleState.pipelineComplete();
                    })
            }

            if (bundle.cssIn && bundle.cssIn.length > 0) {
                gulp.src(bundle.cssIn)
                    .pipe(bundleState.acceptFile())
                    .on('finish', function () {
                        bundleState.pipelineComplete();
                    })
            }
        };

        for (var bundleI = 0; bundleI < styleBundles.length; bundleI++) {
            processBundle(styleBundles[bundleI]);
        }
    });
});

gulp.task('bundle-jspm', shell.task(bundleJspmTasks, {quiet : false}));
////////////////////////////////////////
//////// Copy tasks (i.e. take input files verbatim)
////////////////////////////////////////

gulp.task('copy-fonts', function() {
    return gulp.src(fontsSrc)
        .pipe(rename(function (path) {
            path.dirname = '.';
        }))
        .pipe(gulp.dest(fontsDest));
});

gulp.task('copy-static', function() {
    return gulp.src(staticSrc)
        .pipe(gulp.dest(staticDest));
});

gulp.task('copy-data', function() {
    return gulp.src(dataSrc)
        .pipe(gulp.dest(dataDest));
});

gulp.task('copy-es6', ['bundle-jspm'], function() {
    return gulp.src([interOutput + "/**/*.js"])
        .pipe(gulp.dest(jsDest));
});

gulp.task('copy-js', function() {
    return gulp.src([jsSrc])
        .pipe(gulp.dest(jsDest));
});

gulp.task('minifycss', ['build-style'], function() {
    return gulp.src(['!' + cssDest + "/**/*.min.css", cssDest + "/**/*.css"])
        .pipe(minifyCSS())
        .pipe(rename(function (path) {
            path.extname = buildCssExt;
        }))
        .pipe(gulp.dest(cssDest));
});

gulp.task('minifyjs', ['copy-js', 'copy-es6'], function(){
    return gulp.src([jsSrc, '!' + interOutput + "/**/*.min.js", interOutput + "/**/*.js"])
        .pipe(uglify())
        .pipe(rename(function (path) {
            path.extname = buildJsExt;
        }))
        .pipe(gulp.dest(jsDest));
});

gulp.task('minify', ['minifycss', 'minifyjs']);

////////////////////////////////////////
//////// Clean tasks
////////////////////////////////////////

gulp.task('clean-dev-files', ['minify'], function(){
    return gulp.src(['!' + cssDest + "/**/*.min.css", cssDest + "/**/*.css", '!' + jsDest + "/**/*.min.js", jsDest + "/**/*.js"], { read: false })
        .pipe(clean());
});

// Removes all files from ./dist/
gulp.task('clean', function() {
    return gulp.src([baseDestPath, interOutput], { read: false })
        .pipe(clean());
});

////////////////////////////////////////
//////// Development tasks
////////////////////////////////////////

gulp.task('serve', ['default', 'watch'], function() {

    return new Promise(function(resolve, reject){

        console.log("Starting server...");
        //2. serve at custom port
        var server = gls.static(baseDestPath, 8080);
        server.start();

        //use gulp.watch to trigger server actions(notify, start or stop)
        return gulp.watch([baseDestPath + '/**/*'], function () {
            server.notify.apply(server, arguments);
        });
    })
});

// serve-prod is to test out minified builds
// use serve for active development
gulp.task('serve-prod', ['dist'], function() {

    //2. serve at custom port
    var server = gls.static(baseDestPath, 8080);
    server.start();

});

gulp.task('sizereport', function() {
    return gulp.src([baseDestPath + "/**/*.js", baseDestPath + "/**/*.css"])
        .pipe(sizereport({
            gzip : true
        }));
});

////////////////////////////////////////
//////// Porcelain tasks
////////////////////////////////////////

gulp.task('default', ['build', 'copy']);

gulp.task('build', ['bundle-jspm', 'build-style', 'build-html', 'build-markdown', 'build-generated']);

gulp.task('copy', ['copy-fonts', 'copy-static', 'copy-data', 'copy-js', 'copy-es6']);

gulp.task('watch', ['default'], function() {

    return new Promise(function(resolve, reject) {
        gulp.watch(styleSrc, ['build-style']).on('change', reportChange);
        gulp.watch([es6Src], ['copy-es6']).on('change', reportChange);
        // Note: Markdown depends on the HTML templates, which is why the two are coupled
        gulp.watch([htmlSrc, mdSrc, generatedSrc], ['build-html', 'build-markdown', 'build-generated']).on('change', reportChange);

        gulp.watch([fontsSrc], ['copy-fonts']).on('change', reportChange);
        gulp.watch([staticSrc], ['copy-static']).on('change', reportChange);
        gulp.watch([dataSrc], ['copy-data']).on('change', reportChange);
        gulp.watch([jsSrc], ['copy-js']).on('change', reportChange);

        resolve();
    });
});

gulp.task('set-prod-env', function(cb){
    setBuildEnv('prod');
    cb();
});

gulp.task('dist', ['set-prod-env', 'default', 'minify', 'clean-dev-files']);

////////////////////////////////////////
//////// HTML and Markdown Helpers
////////////////////////////////////////

/**
 * Credit: gulp-replace
 */
function parsePath(p) {
    var extname = path.extname(p);
    return {
        dirname: path.dirname(p),
        basename: path.basename(p, extname),
        extname: extname
    };
}

/**
 * Fold in the front matter data into file.data
 * And resolve paths
 * - pretend that the file is an HTML file in $htmlSrc (rewrite $file.path)
 */
function mergeFrontMatterIntoData(){
    return through.obj(function (file, enc, cb) {
        if (file.isNull()) {
            return cb(null, file);
        }

        if (!file.frontMatter){// || !file.frontMatter.layout || file.frontMatter.layout.length == 0) {
            return cb(null, file);
        }

        // firstly, to be compatible with gulp-data, merge front-matter into data attribute
        // so variables can be referenced from within the swig template
        file.data = file.data || {};
        file.data = _.merge(file.data, file.frontMatter);
        cb(null, file);
    });
};

var rePostName = /(\d{4})-(\d{1,2})-(\d{1,2})-(.*)/;
function renameLikeJekyll(){
    return through.obj(function (file, enc, cb){
        var parsedPath = parsePath(file.path);
        file.originalPath = file.path;
        file.data = file.data || {};

        // Jekyll has a naming convention.  If this file matches that convention,
        // we should pull out the date and title parts
        var match = rePostName.exec(parsedPath.basename);
        if (match) {
            var jn = {
                year : match[1],
                month : match[2],
                day : match[3],
                title : match[4]
            };
            var urlDate = moment(jn.year + "-" + jn.month + "-" + jn.day, "YYYY-MM-DD");

            file.data.urlDate = urlDate;
            file.data.jekyllFilename = jn;
        }

        // For swig to work, we need to make it look like the reslting HTML is inside the HTML directory
        parsedPath.dirname = parsedPath.dirname.replace("/markdown/", "/html/");
        file.base = file.base.replace("/markdown/", "/html/");

        // handle date as a special-case.
        // We support two formats (with and without time) in front matter
        // And we support setting the date via URL
        if(file.data.date){
            var fmDate = moment(file.data.date, "YYYY-MM-DD HH:mm");
            if (fmDate.isValid()) {
                file.data.date = fmDate;
                file.data.displayDate = fmDate.format(blogDateFormat);
            } else {
                fmDate = moment(file.data.date, "YYYY-MM-DD");
                if(fmDate.isValid()){
                    file.data.date = fmDate;
                    file.data.displayDate = fmDate.format(blogDateFormat);
                }
                else {
                    file.data.date = null; // not a valid moment
                }
            }
        };

        // fallback, if front-matter doesn't specify date, then the url should
        if(!file.data.date || !file.data.displayDate){
            var urlDate = file.data.urlDate;
            if(urlDate){
                if(!file.data.date){
                    file.data.date = urlDate;
                }
                file.data.displayDate = urlDate.format(blogDateFormat);
            } else {
                file.data.displayDate = file.data.date;
            }
        }

        // fill in year, month, day values if date is calculated
        if(file.data.date){
            file.data.year = file.data.date.format("YYYY");
            file.data.month = file.data.date.format("MM");
            file.data.day = file.data.date.format("DD");
        }

        // Following jekyll's example, many people put their posts within a "_posts" folder
        // We want to filter this out
        var dirnames = parsedPath.dirname.split(path.sep);
        var basePath = path.sep;
        for(var i = 0;i<dirnames.length;i++){
            var dir = dirnames[i];
            if(dir.indexOf("_") == 0){
                // stop processing
                i = dirnames.length;
            } else {
                basePath = path.join(basePath, dir);
            }
        }

        // Next, jekyll has behavior of renaming target files based on front-matter
        // and an algorithm

        // Given a calculated slug, "apply" it in a consistent way to the file.path
        function applySlug(inSlug){
            var slug = inSlug;
            var slugExt = path.extname(slug);

            if(slugExt != ".html"){
                if(slug.lastIndexOf("/") == slug.length - 1){
                    slug = slug + "index.html";
                }
                else {
                    slug = slug + ".html";
                }
            }

            file.data.slug = slug;
            file.path = path.join(basePath, slug);
        }

        // The hard-coded slug behavior
        function useDefaultSlug(){
            if(file.data.slug && file.data.slug.length > 0){
                applySlug(file.data.slug);

            }
            else if(file.data.permalink && file.data.permalink.length > 0){
                applySlug(file.data.permalink)
            }
            else {
                file.path = path.join(basePath, parsedPath.basename + ".html");
            }
        }

        // Decision point for user-provided code
        if(letMeCalculateSlug(parsedPath.basename, file)){
            var slug = calcSlug(parsedPath.basename, file);
            if(slug){
                applySlug(slug);
            } else {
                useDefaultSlug();
            }
        } else {
            useDefaultSlug();
        }


        cb(null, file);
    })
}
/**
 * Given output mergeFrontMatterIntoData,
 *  - render the HTML using marked (either in streaming or buffer mode)
 *  - wrap the file contents in {% extends $frontMatter.layout %} {% block contents %} $file.contents {% endblock %}
 */
function applyFrontMatterLayout(layoutDir) {
    return through.obj(function (file, enc, cb) {

        if (file.isNull()) {
            return cb(null, file);
        }

        var layout = file.data.layout;

        if(!layout){
            // do nothing
            return cb(null, file);
        }

        if(layoutDir){
            var resolvedDir = path.resolve(path.dirname(file.path), path.join(file.base, layoutDir));
            layout = path.join(resolvedDir, layout);
        }

        if(path.extname(layout) != ".html"){
            layout = layout + ".html";
        }

        var prepend = "{% extends '" + layout + "' %}\n\n{% block content %}\n";
        var append = "\n{% endblock %}";

        if (file.isStream()) {
            // And we want swig to think the HTML is part of a layout
            file.contents = file.contents
                .pipe(insert.wrap(prepend,append))
            ;

            return cb(null, file);
        }

        if (file.isBuffer()) {
            var str = prepend + String(file.contents) + append;
            file.contents = new Buffer(str);
            return cb(null, file);
        }
    })
};

function addGitInfo(){
    return through.obj(function(file, enc, cb){

        if(_.size(gitCache) > 0){
            file.data = file.data || {};
            file.data.gitRevShort = gitCache.short;
            file.data.gitBranch = gitCache.branch;

            cb(null, file);
        }
        else {
            var gitInfo = {
                short: "Development",
                branch: "master"
            };
            revision.short(function (str) {
                gitInfo.short = str;
                revision.branch(function (str) {
                    gitInfo.branch = str;

                    file.data = file.data || {};
                    file.data.gitRevShort = gitInfo.short;
                    file.data.gitBranch = gitInfo.branch;

                    gitCache = gitInfo;

                    cb(null, file);
                });
            });
        }
    });
}

/**
 *  Adds in revision information, script src, and style hrefs to the file.data object
 *  so it may be used by swig
 */
function addSiteContext(siteContext){
    return through.obj(function (file, enc, cb) {
        try {

            file.data = file.data || {};

            var dirname = path.dirname(file.path);
            var relPath = path.relative(dirname, file.base);

            file.data.jsExt = buildJsExt;
            file.data.cssExt = buildCssExt;

            for (var i in jspmBundleSfx) {
                var jspm = jspmBundleSfx[i];
                file.data['js' + jspm.id] = path.join(relPath, jspm.out + buildJsExt);
            }

            for (var i in styleBundles) {
                var style = styleBundles[i];
                file.data['css' + style.id] = path.join(relPath, style.out + buildCssExt);
            }

            file.data.site = resolveSiteContext(file, dirname, siteContext);

            /*
             console.log("==========")
             console.log(file.path);
             console.log(file.data.site);
             */

            if(file.data.collection){
                _.forEach(file.data.collection, function(item){
                    item.data.site = file.data.site;
                });
            }

            cb(null, file);
        }
        catch(e){
            console.log("error", e, file.path);
            cb(e);
        }
    })
};

function removeSiteContext(){
    return through.obj(function(file, enc, cb){
        file.data = file.data || {};
        delete file.data.site;

        cb(null, file);
    })
}

function snippet(marker) {
    return through.obj(function (file, enc, cb) {
        var contentsSplit = file.contents.toString().split(marker);

        if(contentsSplit.length > 1){
            file.contents = new Buffer(contentsSplit[0]);
        } else {
            var p = file.originalPath || file.path;
            var ext = path.extname(p);
            // in the case of markdown files, we automatically generate
            if(ext == ".md" || ext == ".markdown") {
                file.contents = new Buffer(
                    _.trunc(file.contents.toString(), {length: 256})
                );
            } else {
                // clear the file contents since there is no summary
                // for non-markdown files (business requirements)
                file.contents = new Buffer("");
            }
        }

        cb(null, file);

    });
}
/**
 * For reasons I can't explain, gulp-marked is not working
 * so this is to work around it.  I'd rather just call gulp-marked directly
 */

var reShortHand = /post:([a-zA-Z0-9_\-.]+)/g;
var reReplacement = "%{{site.postpath(\"$1\")}}%";

var reUrl = /url:([/a-zA-Z0-9_\-.]+)/g;
var reUrlReplacement = "%{{site.relpath(\"$1\")}}%";

var reDoc = /doc:([/a-zA-Z0-9_\-.]+)/g;
var reDocReplacement = "%{{site.docpath(\"$1\")}}%";
function markdown(){
    return through.obj(function(file, enc, cb){

        if (file.isNull()) {
            return cb(null, file);
        }

        if (file.isStream()) {
            // And we want swig to think the HTML is part of a layout
            console.log(file.path, " has stream markdown");
            var rs = require('replacestream');
            file.contents = file.contents
                .pipe(markerTransform({}))
                .pipe(rs(reShortHand, reReplacement))
                .pipe(rs(reUrl, reUrlReplacement))
                .pipe(rs(reDoc, reDocReplacement))
                .pipe(rs("[&quot;", "[\""))
                .pipe(rs("[&quote;", "[\""))
                .pipe(rs("&quot;]", "\"]"))
                .pipe(rs("&quote;]", "\"]"))
                /*
                 .on('finish', function(){
                 cb(null, file);
                 })
                 */
            ;
            return cb(null, file);
        }

        if (file.isBuffer()) {
            marked(String(file.contents), function(err, content){
                // https://github.com/chjj/marked/issues/163
                file.contents = new Buffer(
                    content
                        .replace(reShortHand, reReplacement)
                        .replace(reUrl, reUrlReplacement)
                        .replace(reDoc, reDocReplacement)
                        .replace("[&quot;", "[\"")
                        .replace("[&quote;", "[\"")
                        .replace("&quot;]", "\"]")
                        .replace("&quote;]", "\"]")
                );
                cb(null, file);
            })
        }
    });
}

function ignoreDrafts(){
    return through.obj(function(file, enc, cb){
        if (file.isNull()) {
            return cb(null, file);
        }

        if(_.size(file.frontMatter) > 0){
            // unset, we assume it is published
            if(file.frontMatter.published === undefined || file.frontMatter.published === null){
                return cb(null, file);
            }
            else {
                var isPublished = file.frontMatter.published.toString();
                if(isPublished == "false"){
                    // remove the file from the stream
                    cb();
                } else {
                    cb(null, file);
                }
            }
        }
        else {
            return cb(null, file);
        }
    });
}

/**
 * Given a populated siteContext global value, generate the collections of files and posts into
 *  - lists
 *  - grouped by date
 *  - grouped by category (categories)
 */
function generateIndicies(){
    return through.obj( function(file, enc, cb){

        var collection = [];

        if(file.data && file.data.collection) {
            if (_.isArray(file.data.collection)) {
                collection = file.data.collection;
            } else {
                collection = scWrapper.siteContext[file.data.collection] || [];
            }
        }

        function calcFilename(file, index, key){
            var filename = null;
            if(index == 0){
                if(file.data.filename0 && file.data.filename0.length > 0){
                    filename = file.data.filename0;
                }
            }

            if(!filename){
                filename = file.data.filename || path.basename(file.path, ".html") + "-$key.html";
            }

            return filename.replace("$key", key);
        }

        if(collection && _.size(collection) > 0) {
            // for each item in the collection, create a new file in the stream
            var dirname = path.dirname(file.path.replace("/generated/", "/html/"));
            var base = file.base.replace("/generated/", "/html/");

            var self = this;
            var keys = _.keys(collection);
            for(var i=0;i<keys.length;i++){
                var key = keys[i];
                var item = collection[key];

                var filename = calcFilename(file, i, key);

                var copy = new File({
                    cwd: String(file.cwd),
                    base: String(base),
                    path: path.join(dirname, filename),
                    contents: new Buffer(file.contents.toString())
                });

                copy.data = _.cloneDeep(file.data) || {};
                copy.data.title = copy.data.title || "";
                copy.data.title = copy.data.title.replace("$key", key);
                copy.frontMatter =_.cloneDeep(file.frontMatter) || {};
                copy.summary = _.cloneDeep(file.summary) || {};

                copy.data.collection = _.map(item, function(fileId){
                    return resolveFile(dirname, fileId);
                });
                copy.data.collectionKey = key;
                copy.data.collectionI = i;
                copy.data.keys = keys;
                copy.data.nextKey = null;
                if(i < keys.length - 1){
                    copy.data.nextFilename = calcFilename(file, i+1, keys[i+1]);
                    copy.data.nextKey = keys[i+1];
                }
                copy.data.prevKey = null;
                if(i > 0){
                    copy.data.prevFilename = calcFilename(file, i-1, keys[i-1]);
                    copy.data.prevKey = keys[i-1];
                }
                self.push(copy);
            }
            cb();
        } else {
            console.log(file.path + " appears misconfigured for generated directory. It is missing a collection.");
            // skip
            cb();
        }
    })
}

function resolveFile(fromDir, file) {

    if(!file)
    {
        return "";
    }

    var id = file["id"] || file;

    var fref = scWrapper.siteContext.refLookup[id];

    if (!fref) {
        return "";
    }

    if(fref.data && fref.data.site){
        fref.data.site = {};
    }

    var fcopy = _.clone(fref);
    fcopy.data = _.clone(fref.data) || {};

    var toDir = path.dirname(fcopy.path);

    fcopy.url = path.join(path.relative(fromDir, toDir), path.basename(fcopy.path));
    return fcopy;
}

/**
 * Given a dirname, this returns a copy of the site context with each path fixed up as an appropriate relative path
 * @param dirname
 * @param siteContext
 */
function resolveSiteContext(file, fromDir, siteContext){

    var returnedCopy = {};
    returnedCopy.resolvedFor = file.path;
    returnedCopy.buildDate = moment(siteContext.buildDate);


    /**
     * Given an abspath as input, this resolve the relative
     * path for an arbitrary resource
     * @param p
     * @returns {*|string}
     */
    returnedCopy.relpath = function(p){
        return returnedCopy._unsafeResolver(p) || "";
    };

    /**
     * Same thing as relpath except assumes you mean a document
     * @param p
     * @returns {*}
     */
    returnedCopy.docpath = function(p){
        var query = p;
        if(p && p.lastIndexOf("/") == p.length - 1){
            query = p + "index.html";
        }
        var extname = path.extname(query);
        if(!extname || extname == ""){
            query = query + "/index.html";
        }
        var relDir = returnedCopy._unsafeResolver(query);
        if(!relDir || relDir.length == 0){
            // don't want to return an absolute path by mistake
            return "";
        } else {
            return relDir;
        }
        return relDir;

    };

    /**
     * It's silly how much work this is to work around path.relative
     * not quite working for the web.
     * @param p the abs path in the dist folder
     * @returns {*}
     */
    returnedCopy._unsafeResolver = function(p){
        var targetFile = path.join(file.base, p);
        var targetName = path.basename(targetFile);
        if(p == "/"){
            targetName = "";
        }

        var targetDir = path.dirname(targetFile);
        var sourceDir = path.dirname(file.path);

        var relDir = path.relative(sourceDir, targetDir);
        var relPath = path.join(relDir, targetName);
        return relPath;
    };

    /**
     * Pre-computed references to other posts
     */
    returnedCopy.postpath = function(p) {
        var toFile = siteContext.postPaths[p];
        if(toFile){
            return path.relative(fromDir, toFile);
            //return returnedCopy._unsafeResolver(toFile);
        } else {
            return "";
        }
    };

    /*


     _.mapValues(siteContext.postPaths, function(toFile){
     var relDir = path.relative(fromDir, toFile);
     if(!relDir || relDir.length == 0){
     // don't want to return an absolute path by mistake
     return "";
     } else {
     return relDir;
     }
     });
     */

    function scResolveFile(file){
        return resolveFile(fromDir, file);
    }

    function removeSelfReference(f){
        //return f.path != file.path;
        return true;
    }



    returnedCopy.files = _(siteContext.files).map(scResolveFile).filter(removeSelfReference).value();

    returnedCopy.posts = _(siteContext.posts).map(scResolveFile).filter(removeSelfReference).value();

    if(siteContext.categories) {
        returnedCopy.categories = _.mapValues(siteContext.categories, function (category) {
            return _(category).map(scResolveFile).filter(removeSelfReference).value();
        });
    }

    if(siteContext.tags) {
        returnedCopy.tags = _.mapValues(siteContext.tags, function (tag) {
            return _(tag).map(scResolveFile).filter(removeSelfReference).value();
        });
    }

    returnedCopy.dateGroups = _.mapValues(siteContext.dateGroups, function(group){
        var g = _.clone(group);
        g.posts = _(group.posts).map(scResolveFile).filter(removeSelfReference).value();
        return g;
    });




    return returnedCopy;
}

function addCategories(){
    return through.obj(function (file, enc, cb){
        if(_.size(file.frontMatter) > 0 ){

            function getListing(list, scalar){
                var listing = [];
                if(list && _.isArray(list)){
                    listing = list;
                }
                else if(list && list.length > 0){
                    // legacy version... assume Jekyll behavior
                    listing = list.split(/\s+/);
                }

                if(scalar && scalar.length > 0){
                    listing.push(scalar);
                }

                return listing;
            }

            file.data.categories = getListing(file.data.categories, file.data.category);
            file.data.tags = getListing(file.data.tags, file.data.tag);

        }

        cb(null, file);
    })
}

function buildSiteContext(siteContext){
    return through.obj(function (file, enc, cb){

        file.data = file.data || {};

        // copying the whole file causes problems with cloneDeep
        var fref = {
            id   : _.uniqueId(),
            path : file.path,
            data : _.clone(file.data),
            base : file.base
        };

        // in-memory references
        siteContext.refLookup = siteContext.refLookup || {};
        siteContext.refLookup[fref.id] = fref;

        siteContext.posts = siteContext.posts || [];
        siteContext.postPaths = siteContext.postPaths || {};
        siteContext.categories = siteContext.categories || {};
        siteContext.tags = siteContext.tags || {};

        // add all files
        siteContext.files = siteContext.files || [];
        siteContext.files.push(fref.id);

        siteContext.directories = siteContext.directories || {};
        siteContext.directories[path.dirname(file.path)] = true;

        if(_.size(file.frontMatter) > 0 ){
            // front matter also means this is a "post" in the jekyll sense
            siteContext.posts.push(fref.id);

            var postKey = path.basename(fref.path, path.extname(fref.path));
            siteContext.postPaths[postKey] = fref.path;

            // if there is front matter, then we should optionally add to any categories
            if(file.data.categories) {
                _.forEach(file.data.categories, function (categoryName) {
                    siteContext.categories[categoryName] = siteContext.categories[categoryName] || [];
                    siteContext.categories[categoryName].push(fref.id);
                });
            }

            if(file.data.tags) {
                _.forEach(file.data.tags, function (tagName) {
                    siteContext.tags[tagName] = siteContext.tags[tagName] || [];
                    siteContext.tags[tagName].push(fref.id);
                });
            }

            file.id = fref.id;
            // can't have circular references
            cb(null, file);
        }
        else {
            cb();
        }

    })
}

function addSummary(siteContext){
    return through.obj(function(file, enc, cb){

        var fref = siteContext.refLookup[file.id];
        if(!fref){
            console.log("Could not add summary to", file.path);
            return cb(null, file);
        }
        else {
            // taking advantage of passing by reference
            if(file.contents){
                fref.summary = String(file.contents.toString());
            }

            file.contents = new Buffer("");

            cb(null, file);
        }
    })
}

function reporter(name){
    return through.obj(function(file, enc, cb){
        //console.log(name, path.basename(file.path));

        cb(null, file);
    })
}

/**
 * A simple sink to make sure streams explicitly drain
 * @param name
 */
function sink(name){
    return through.obj(function(file, enc, cb){
        cb();
    })
}

/**
 * After the pipeline has populated siteContext,
 * go through and collect, group, and sort per business requirements
 */
function groupSiteContext(siteContext){

    var absHtmlSrc = baseMainPath + "/html";

    siteContext.paths = siteContext.paths || {};
    _.forEach(siteContext.directories, function(bool, dir){
        var relPath = path.relative(absHtmlSrc, dir);

        if(!relPath){
            siteContext.paths["/"] = dir;
        }else {
            // To be complete, we compute all possible directories based on the files
            // For example, if you have files in /blog/posts, you still want a link to /blog
            // but /blog is "generated" so there is no it would ever be picked up by this context
            var relParts = relPath.split(path.sep);
            var concatPath = "";
            for(var i =0; i<relParts.length;i++){
                var part = relParts[i];
                concatPath += path.sep + part;
                siteContext.paths[concatPath] = path.resolve(path.join(absHtmlSrc, concatPath));
            }
        }

    });


    siteContext.files = _.sortBy(siteContext.files, function(file){
        return String(file.path);
    });

    // sort by date (most recent first)
    siteContext.posts = _.sortBy(siteContext.posts, function(pId){
        var post = siteContext.refLookup[pId];

        if(moment.isMoment(post.data.date)){
            return -post.data.date.unix();
        } else {
            return post.data.title;
        }
    });

    // group by date

    siteContext.dateGroups = _(siteContext.posts).groupBy(function(pId){
        var post = siteContext.refLookup[pId];
        if(moment.isMoment(post.data.date)){
            return post.data.date.format(blogDateGrouping);
        } else {
            return "Timeless";
        }
    }).map(function(group, key){
        var m = moment(key, blogDateGrouping);
        return {
            key : key,
            year: m.format("YYYY"),
            month: m.format("MM"),
            sortKey : m.unix(),
            title: m.format(blogDateGroupingTitle),
            posts: _.sortBy(group, function(pId){
                var post = siteContext.refLookup[pId];
                if(moment.isMoment(post.data.date)) {
                    return - post.data.date.unix();
                }
                else {
                    return "Timeless";
                }
            })
        }
    }).sortBy(function(obj){
        return -obj.sortKey;
    }).value();

    // group by page

    siteContext.postPages = _.groupBy(siteContext.posts, function(pId, index){
        return Math.floor(index / blogPageSize);
    });

    return true;
}

var gitCache = {};

// Helps keep the extensions straight during compilation
var buildJsExt = ".js";
var buildCssExt = ".css";

function setBuildEnv(env){
    if(env == "prod"){
        buildJsExt = ".min.js";
        buildCssExt = ".min.css";
    }
}