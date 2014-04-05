var mongoose = require( 'mongoose' );
var Schema   = mongoose.Schema;
 
var Vacancy = new Schema({
    vacancy : String
});
 
mongoose.model( 'Vacancy', Vacancy );
mongoose.connect( 'mongodb://localhost/work' );