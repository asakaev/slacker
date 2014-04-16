var mongoose = require('mongoose');

var sputnikSchema = mongoose.Schema({
    vacancy: String,
    text: String,
    idSputnik: Number,
    tel: String,
    added: Date,
    issue: Number
}, { versionKey: false,
    collection: 'sputnik'});
var vacancy = mongoose.model('Vacancy', sputnikSchema);

mongoose.connect('mongodb://localhost/work');