#!/usr/bin/env node

var fs = require('vinyl-fs')
var ftp = require('vinyl-ftp')
var minimist = require('minimist')
var args = minimist(process.argv.slice(2))

const remoteFolder = '/htdocs/'

var ftp_user, ftp_pass, ftp_host
console.log(args)
if (!args.ftp_user || !args.ftp_pass || !args.ftp_host) {
    console.error("Unsupport ftp args!")
    return
}

var conn = ftp.create({
    host: args.ftp_host,
    user: args.ftp_user,
    password: args.ftp_pass,
    parallel: 10,
})
console.log("starting upload")
let start = Date.now()
fs.src(['./**/*.html', 'atom.xml', 'index.html'], {
        buffer: false
    })
    .pipe(conn.differentSize(remoteFolder))
    .pipe(conn.dest(remoteFolder))
    