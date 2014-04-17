var mongoose = require('mongoose');
var natural = require('natural');

var jonniewalker = natural.JaroWinklerDistance;
var metaphone = natural.Metaphone;
var levenshtein = natural.LevenshteinDistance;

var db = mongoose.connection;
var dictSchema = mongoose.Schema({
    text: String,
    translite: String
}, { versionKey: false,
    collection: 'dictionary'});
var dict = mongoose.model('Dict', dictSchema);

var dbContent;

var possibleWord = [],
    correct = [],
    result = [],
    meta_result = [],
    similarity = 0,
    meta_similarity = 0,
    min_levenshtein = 1000,
    meta_min_levenshtein = 1000;

mongoose.connect('mongodb://localhost/work', function (err) {
    if (err) console.log(err);

    var start = new Date().getTime();
    dict.find({}, '-_id', function (err, result) {
        if (err) console.log(err);

        dbContent = result;
        var time = new Date().getTime() - start;
        console.log('Get data from db to RAM in ' + time / 1000 + ' sec: ' + dbContent["0"]);

        findDbAndReplace('ЯДЕРНЫЙ2');
    });
});

function translite(str) {
    var arr = {'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ж': 'g', 'з': 'z', 'и': 'i',
        'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't',
        'у': 'u', 'ф': 'f', 'ы': 'i', 'э': 'e', 'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E',
        'Ж': 'G', 'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M', 'Н': 'N', 'О': 'O', 'П': 'P',
        'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U', 'Ф': 'F', 'Ы': 'I', 'Э': 'E', 'ё': 'yo', 'х': 'h', 'ц': 'ts',
        'ч': 'ch', 'ш': 'sh', 'щ': 'shch', 'ъ': '', 'ь': '', 'ю': 'yu', 'я': 'ya', 'Ё': 'YO', 'Х': 'H', 'Ц': 'TS',
        'Ч': 'CH', 'Ш': 'SH', 'Щ': 'SHCH', 'Ъ': '', 'Ь': '', 'Ю': 'YU', 'Я': 'YA'};
    var replacer = function (a) {
        if (arr[a] == '') return '';
        else return (arr[a] || a);
    };
    return str.replace(/[А-яёЁ]/g, replacer);
}

function findDbAndReplace(str, callback) {
    dict.findOne({'text': str}, '-_id', function (err, result) {
        if (err) console.log(err);

        if (result) {
            console.log('This word IS in DB. Callback now if it is.');
            return str;
        } else {
            getPossibleWords(str, youMean);
        }
    });
}

function getPossibleWords(str, callback) {
    var start = new Date().getTime();
    var translited = translite(str);

    for (var k in dbContent) {
        var lev = levenshtein(metaphone.process(translited), metaphone.process(dbContent[k].translite));
        var met = ((metaphone.process(translited).length) / 2) + 1;

        if (lev < met) {
            if (levenshtein(translited, dbContent[k].translite) < translited.length / 2 + 1) {
                possibleWord.push(dbContent[k].text);
            }
        }
    }
    var time = new Date().getTime() - start;
    console.log('Done getting lev and met in ' + time / 1000 + ' sec.');
    console.log('Found: ' + possibleWord.length);

    if (callback) {
        callback(str);
    }
}

function youMean(str) {
    console.log(possibleWord.length);

    if ((possibleWord.length)) {
        for (var i in possibleWord) {
            min_levenshtein = Math.min(min_levenshtein, levenshtein(possibleWord[i], str));
        }

        //Считаем максимальное значение подобности слов
        for (var i in possibleWord) {
            if (levenshtein(possibleWord[i], str) == min_levenshtein) {
                similarity = Math.max(similarity, jonniewalker(possibleWord, str));
                //console.log(similar_text('possibleWord', 'str'));
            }
        }

        //Проверка всего слова
        for (var i in possibleWord) {
            if (levenshtein(possibleWord[i], str) <= min_levenshtein) {
                if (jonniewalker(possibleWord[i], str) >= similarity) {
                    result.push(possibleWord[i]);
                }
            }
        }

        for (var i in result) {
            meta_min_levenshtein = Math.min(meta_min_levenshtein, levenshtein(metaphone.process(result[i]), metaphone.process(str)));
        }

        //Считаем максимальное значение подобности слов
        for (var i in result) {
            if (levenshtein(result[i], str) == meta_min_levenshtein) {
                meta_similarity = Math.max(meta_similarity, jonniewalker(metaphone.process(result[i]), metaphone.process(str)));
                //console.log(similar_text('metaphone(result[i])', 'metaphone(str)'));
            }
        }


        //Проверка через метафон
        for (var i in result) {
            if (levenshtein(metaphone.process(result[i]), metaphone.process(str)) <= meta_min_levenshtein) {
                if (jonniewalker(metaphone.process(result[i]), metaphone.process(str)) >= meta_similarity) {

                    meta_result.push(result[i]);
                }
            }
        }

        correct.push(meta_result.pop());

    }
    else {

        correct.push(str);
    }
    console.log("correct:");
    console.log(correct.pop());
}