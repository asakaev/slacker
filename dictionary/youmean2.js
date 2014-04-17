var mongoose = require('mongoose');

var db = mongoose.connection;
var dictSchema = mongoose.Schema({
    text: String,
    translite: String
}, { versionKey: false,
    collection: 'dictionary'});
var dict = mongoose.model('Dict', dictSchema);


mongoose.connect('mongodb://localhost/work', function (err) {
    if (err) console.log(err);
    findDbAndReplace('МЕТРОВЫЙ');
});





function findDbAndReplace (str, callback) {
    dict.findOne({'text': str}, '-_id', function (err, result) {
        if (err) console.log(err);

        console.log(result);


    });
}