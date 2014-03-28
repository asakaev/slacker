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
      mongoose.connect('mongodb://localhost/test');
      var db = mongoose.connection;
      db.on('error', console.error.bind(console, 'connection error:'));
      db.once('open', function callback () {
        var Kitten = mongoose.model('Kitten', kittySchema)

        Kitten.find({ name: new RegExp(req.query.q, 'i') }, function (err, kittens) {
        if (err) return console.error(err);
          res.jsonp(kittens);
          mongoose.disconnect();
        })

      });
    }
};