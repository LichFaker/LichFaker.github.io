#!/usr/bin/env node

var glob = require("glob");
var Client = require("ftp");
var minimist = require("minimist");
var args = minimist(process.argv.slice(2));

const remoteFolder = "/htdocs/";

const PORT = 21;
console.log(args);
if (!args.ftp_user || !args.ftp_pass || !args.ftp_host) {
  console.error("Unsupport ftp args!");
  return;
}

var client = new Client();

client.on("ready", function() {
  client.cwd(remoteFolder, err => {
    if (!err) {
      upload();
    } else {
      client.end();
      console.log(err);
    }
  });
});

client.connect({
  host: args.ftp_host,
  port: PORT,
  user: args.ftp_user,
  password: args.ftp_pass
});

console.log("starting upload");

function upload() {
  var totalNum = 0;
  var uploadCount = 0;
  glob("**/*.?(html|xml|jpeg|png)", (err, files) => {
    if (!err) {
      totalNum = files.length;
      files.forEach(f => {
        let dir = f.substring(0, f.lastIndexOf("/"));
        client.mkdir(dir, true, err => {
          client.put(f, f, err => {
            uploadCount++
            if (err) {
              console.log(err);
            }
            if (uploadCount === totalNum) {
                client.end()
                console.log("finishing upload");
            }
          });
        });

        // console.log(f);
      });
    } else {
      console.log(err);
      client.end()
    }
  });
}
