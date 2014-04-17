var fs = require('fs');
var readline = require('readline');
var mongoose = require('mongoose');

var db = mongoose.connection;
var dictSchema = mongoose.Schema({
    text: String,
    translite: String
}, { versionKey: false,
    collection: 'dictionary'});
var dict = mongoose.model('Dict', dictSchema);

var count = 0;

function translite(str) {
    var arr = {'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ж': 'g', 'з': 'z', 'и': 'i',
        'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't',
        'у': 'u', 'ф': 'f', 'ы': 'i', 'э': 'e', 'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E',
        'Ж': 'G', 'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M', 'Н': 'N', 'О': 'O', 'П': 'P',
        'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U', 'Ф': 'F', 'Ы': 'I', 'Э': 'E', 'ё': 'yo', 'х': 'h', 'ц': 'ts',
        'ч': 'ch', 'ш': 'sh', 'щ': 'shch', 'ъ': '', 'ь': '', 'ю': 'yu', 'я': 'ya', 'Ё': 'YO', 'Х': 'H', 'Ц': 'TS',
        'Ч': 'CH', 'Ш': 'SH', 'Щ': 'SHCH', 'Ъ': '', 'Ь': '', 'Ю': 'YU', 'Я': 'YA'};
    var replacer = function (a) {
        return (arr[a] || a);
    };
    return str.replace(/[А-яёЁ]/g, replacer);
}

console.log('Dict parse and add to DB.');
mongoose.connect('mongodb://localhost/work', function (err) {
    if (err) {
        console.log(err);
    }

    var rd = readline.createInterface({
        input: fs.createReadStream('lite.txt', {encoding: null}),
        output: process.stdout,
        terminal: false
    });

    rd.on('line', function (line) {
        if (line["0"] == '0') {
            var res = line.split('\t==\t')["1"];
            var tr = translite(res);

            var a = new dict({text: res, translite: tr});
            a.save(function () {
                console.log(++count + ' saved.');
            });
        }
    });
});