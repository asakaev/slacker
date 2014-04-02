var mongoose = require( 'mongoose' );
var Comment = mongoose.model( 'Comment' );

function replaceAllBackSlash(targetStr){
      var index=targetStr.indexOf("\\");
      while(index >= 0){
          targetStr=targetStr.replace("\\",'');
          index=targetStr.indexOf("\\");
      }
      return targetStr;
  }


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
        Comment.find({ name: new RegExp(req.query.q, 'i') }, function (err, kittens) {
        if (err) return console.error(err);
          res.jsonp(kittens);
        }) // end kittens find
      }
    }
};