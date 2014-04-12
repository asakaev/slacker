// var start = new Date().getTime();

var request = require('request');
var cheerio = require('cheerio');
var Iconv = require('iconv').Iconv;
var fromEnc = 'cp1251';
var toEnc = 'utf-8';
var translator = new Iconv(fromEnc, toEnc);

//var mongoose = require('mongoose');
var fs = require('fs');

// var sputnikLastUpdate;
// var date;

var lastAddedVacancyId;
fs.readFile('vse35LastAddedVacancyId.txt', 'utf-8', function read(err, data) {
    if (err) {
        console.log(err);
        //mongoose.disconnect();
        process.exit(1);
    }
    lastAddedVacancyId = data;
    console.log(lastAddedVacancyId);
});

// var db = mongoose.connection;
// var vacanciesSchema = mongoose.Schema({
//     vacancy: String,
//     text: String,
//     sputnikId: String,
//     tel: String,
//     date: String
// }, { versionKey: false });
// var vacancy = mongoose.model('Vacancy', vacanciesSchema);

// var waiter = {}; // wait when all vacancies from sputnik saved (or checked if exist) to db
// waiter.vacCount = 0;
// waiter.vacChecked = 0;
// waiter.vacAdded = 0;
// waiter.incrementAndCheck = function () {
//     if (this.vacCount == ++this.vacChecked) done();
// };

var categoriesCount;
var totalVacancies = 0;

function getJobPage(callback) {
    request({ url: 'http://vse35.ru/job/', encoding: null }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            $ = cheerio.load(translator.convert(body));

            var categories = $('.st-cats-list.two.job .cat');
            categoriesCount = categories.length;
            console.log('Categories count: ' + categoriesCount);

            // считаем количество всех вакансий
            categories.each(function (index) {
                var count = categories[index].children[1].data;
                count = parseInt(count.substring(2, count.length - 1));
                totalVacancies += count;
            });
            console.log('Total vacancies: ' + totalVacancies);

            // смотрим id топ15 записей
            var top15 = $('.item .desc');
            var top15count = top15.length;

            if (top15count != 15) {
                console.log('WRN: Top 15 structure is changed!');
            }

            var index;
            for (index = 0; index < top15count; index++) {
                var id = top15[index].children["1"].children["0"].attribs.href;
                id = parseInt(id.substring(21, id.length))
                console.log(index + ': ' + id);

                if (id == lastAddedVacancyId) {
                    break;
                }

                // если последний элемент
                if (index == top15count - 1) {
                    // chain fx if last
                }
                else {
                    // everyday code fx
                }
            }
        }
    })
};

getJobPage();

// function getContent(pageNum) {
//     request('http://www.sputnik-cher.ru/301/?p=' + pageNum, function (error, response, body) {
//         if (!error && response.statusCode == 200) {
//             $ = cheerio.load(body);
//             var nodes = $('.itemOb');
//             nodes.each(function (index) {
//                 var obj = {};
//                 obj.vacancy = nodes[index].children["3"].children["0"].data;
//                 var text = nodes[index].children["4"].data;
//                 obj.text = text.substring(1, text.length - 7);
//                 obj.sputnikId = nodes[index].children["1"].attribs.name;
//                 if (nodes[index].children["5"].children["0"] !== undefined) {
//                     obj.tel = nodes[index].children["5"].children["0"].data;
//                 }
//                 obj.date = date;

//                 // find if exist and save to db
//                 vacancy.findOne({'sputnikId': obj.sputnikId}, function (err, id) {
//                     if (err) {
//                         console.log(err);
//                         mongoose.disconnect();
//                         process.exit(1);
//                     }

//                     // if not found then save to db
//                     if (!id) {
//                         new vacancy(obj).save(function (err) {
//                             if (err) {
//                                 console.log(err);
//                                 mongoose.disconnect();
//                                 process.exit(1);
//                             }
//                             else {
//                                 waiter.vacAdded++;
//                                 waiter.incrementAndCheck();
//                             }
//                         });
//                     }
//                     else {
//                         waiter.incrementAndCheck();
//                     }
//                 });

//             }); // end of DOM traversal
//         }
//         else {
//             console.log('Cannot get page ' + pageNum + ', stop now.');
//             mongoose.disconnect();
//             process.exit(1);
//         }
//     });
// }

// function pagesLoop(pages) {
//     for (var i = 1; i <= pages; i++) {
//         getContent(i);
//     }
// }

// function done() {
//     mongoose.disconnect();
//     var time = new Date().getTime() - start;
//     console.log(waiter.vacCount + ' vacancies checked and ' + waiter.vacAdded + ' new added to DB in ' + time / 1000 + ' sec.');
// }

// function run() {
//     console.log('Crawler for sputnik started.');
//     mongoose.connect('mongodb://localhost/work', function (err) {
//         if (err) {
//             console.log(err);
//             process.exit(1);
//         }
//     });

//     getPager(function (pagesCount) {
//         pagesLoop(pagesCount);
//     });
// }

// run();