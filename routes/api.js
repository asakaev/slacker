function replaceAllBackSlash(targetStr){
      var index=targetStr.indexOf("\\");
      while(index >= 0){
          targetStr=targetStr.replace("\\",'');
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
      var clean = replaceAllBackSlash(req.query.q);
      if (clean === '')
      {
        res.jsonp([]);
      }
      else
      {
        mongoose.connect('mongodb://dev.vf8.ru:443/test');
        var db = mongoose.connection;
        db.on('error', console.error.bind(console, 'connection error:'));
        db.once('open', function callback () {
          var Kitten = mongoose.model('Kitten', kittySchema)

          Kitten.find({ name: new RegExp(clean, 'i') }, function (err, kittens) {
          if (err) return console.error(err);
            res.jsonp(kittens);
            mongoose.disconnect();
          })
          
        });
      }
    }
};