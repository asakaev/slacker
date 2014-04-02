var mongoose = require( 'mongoose' );
var Vacancy = mongoose.model( 'Vacancy' );

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
        Vacancy.find({ vacancy: new RegExp(clean, 'i') }, function (err, vacancies) {
        if (err) return console.error(err);
          console.log(vacancies);
          res.jsonp(vacancies);
        }) // end kittens find
      }
    }
};