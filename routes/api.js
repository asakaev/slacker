﻿function replaceAllBackSlash(targetStr){
      var index=targetStr.indexOf("\\");
      while(index >= 0){
          targetStr=targetStr.replace("\\","");
          index=targetStr.indexOf("\\");
      }
      return targetStr;
  }

var mongoose = require('mongoose');

var kittySchema = mongoose.Schema({
    name: String
})

exports.dbGetJSON =  function(req, res){

    if (typeof req.query.q === 'undefined') {
      res.jsonp([]);
    }
    else
    {
      mongoose.connect('mongodb://192.168.1.2/test');
      var db = mongoose.connection;
      db.on('error', console.error.bind(console, 'connection error:'));
      db.once('open', function callback () {
        var Kitten = mongoose.model('Kitten', kittySchema)

        var req = replaceAllBackSlash(req.query.q);

        Kitten.find({ name: new RegExp(req, 'i') }, function (err, kittens) {
        if (err) return console.error(err);
          res.jsonp(kittens);
          mongoose.disconnect();
        })

      });
    }
};