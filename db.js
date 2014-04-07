var mongoose = require( 'mongoose' );
var Schema   = mongoose.Schema;
 
var Vacancy = new Schema({
    vacancy : String,
    text : String,
    sputnikId : String,
    tel : String
});
 
mongoose.model( 'Vacancy', Vacancy );
mongoose.connect( 'mongodb://dev.vf8.ru:443/work' );