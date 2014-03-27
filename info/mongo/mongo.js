var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/test');

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback () {
  // yay!
  	var kittySchema = mongoose.Schema({
    	name: String
	})

	var Kitten = mongoose.model('Kitten', kittySchema)

	// var silence = new Kitten({ name: 'Silence' })
	// console.log(silence.name) // 'Silence'

	// var fluffy = new Kitten({ name: 'fluffy' });
	// console.log(fluffy.name)

	// fluffy.save(function (err, fluffy) {
	//   if (err) return console.error(err);
	//   console.log('save fluffy win!');
	// });

	// silence.save(function (err, fluffy) {
	//   if (err) return console.error(err);
	//   console.log('save silence win!');
	// });	

	// Kitten.find(function (err, kittens) {
	//   if (err) return console.error(err);
	//   console.log(kittens)
	// })

	Kitten.find({ name: /^flu/ }, function (err, kittens) {
	  if (err) return console.error(err);
	  console.log(kittens)
	})


});