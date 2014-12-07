var wd = require('wd')
  , _ = require('underscore')
  , fs = require('fs')
  , path = require('path')
  , uuid = require('uuid-js')
  , assert = require('assert');
var VARS = {};

//var b = wd.promiseRemote();
//
//b.on('status', function(info){console.log('[36m%s[0m', info);});b.on('command', function(meth, path, data){  console.log(' > [33m%s[0m: %s', meth, path, data || '');});
//b.init({
//  browserName:'firefox'
//})

bInit
.then(function () { return b.get("https://github.com/"); })
.then(function () { return b.elementByName("user[login]"); })
.then(function (el) { return b.clear(el)
  .then(function () { return b.type(el, "pocproj"); });
})
.then(function () { return b.elementByName("user[email]"); })
.then(function (el) { return b.clear(el)
  .then(function () { return b.type(el, "pocproj@gmail.com"); });
})
.then(function () { return b.elementByName("user[password]"); })
.then(function (el) { return b.clear(el)
  .then(function () { return b.type(el, "PitPituach!1"); });
})
.then(function () { return b.elementByName("q"); })
.then(function (el) { return b.clear(el)
  .then(function () { return b.type(el, "grunt-webdriver"); });
})
.then(function () { return b.elementByName("q"); })
.then(function (el) { return b.type(el, ""); })
.then(function () { return b.elementByLinkText("webdriverio/grunt-webdriver"); })
.then(function (el) { return b.clickElement(el); })
.then(function () { return b.elementByXPath("//ul[@class='numbers-summary']/li[3]/a"); })
.then(function (el) { return b.clickElement(el); })
.fin(function () {
b.quit();
}).done();
