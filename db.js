var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Sputnik = new Schema({
    vacancy: String,
    text: String,
    sputnikId: String,
    tel: String
});

mongoose.model('Sputnik', Sputnik);
mongoose.connect('mongodb://localhost/work');