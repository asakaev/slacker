// vse35 crawler

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
    request({ url: 'http://vse35.ru/job/?print=y', encoding: null }, function (error, response, body) {
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

function getPageById(id) {
    request({ url: 'http://vse35.ru/job/element.php?print=y&eid=' + id, encoding: null }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            $ = cheerio.load(translator.convert(body));
            var vacName = $('.header-desc-ad-box .title');
            var fieldValue = $('.field_value');
            var addedInfo = $('.added-info');
            var price = $('.price');
            var params = $('.item_inner .item_value');
            var picture = $('.preview-box');
            var author = $('.author');
            var tel = $('.field_value').filter(function() { return $(this).css("display") == "none" });


            // взять отдельно блок слева и справа
            // форичем пройтись. если называется "зп" значит подДив пишем в объект
            // иначе никак. они не именованы. переписать всё вообще.

            var obj = {};
            obj.vacancy = vacName["0"].children["0"].data;

            if (author.length != 0) {
                obj.author = author["0"].children["0"].data;
            }

            if (fieldValue["3"]) {
                obj.email = fieldValue["3"].children["0"].data;
            }

            obj.tel = tel["0"].children["0"].data;
            obj.tel = obj.tel.replace(' ', '');
            obj.vse35Id = id;
            obj.added = addedInfo["0"].children["3"].children["1"].children["0"].data;
            obj.edited = addedInfo["0"].children["5"].children["1"].children["0"].data;
            obj.price = price["0"].children["1"].data;
            obj.price = obj.price.substring(1, obj.price.length - 3);
            obj.priceCustom = params["1"].children["0"].data;
            obj.priceCustom = obj.priceCustom.substring(22, obj.priceCustom.length - 11);

            if (params["5"]) {
                obj.fulltime = params["5"].children["0"].data;
                obj.fulltime = obj.fulltime.substring(23, obj.fulltime.length - 18);
            }

            obj.education = params["2"].children["0"].data;
            obj.education = obj.education.substring(23, obj.education.length - 18);

            obj.experience = params["3"].children["0"].data;
            obj.experience = obj.experience.substring(23, obj.experience.length - 18);

            obj.busyness = params["4"].children["0"].data;
            obj.busyness = obj.busyness.substring(23, obj.busyness.length - 18);

            obj.text = $('.detail_text').text();
            obj.text = obj.text.replace('\n', '');

            if (picture["0"]) {
                obj.picture = 'http://vse35.ru' + picture["0"].children["1"].attribs.href;
            }


            console.log(obj);
            var a = 5;

            // find if exist and save to db
            vacancy.findOne({'vse35Id': obj.vse35Id}, function (err, id) {
                if (err) {
                    console.log(err);
                    //mongoose.disconnect();
                    process.exit(1);
                }

                // if not found then save to db
                if (!id) {
                    new vacancy(obj).save(function (err) {
                        if (err) {
                            console.log(err);
                            mongoose.disconnect();
                            process.exit(1);
                        }
                        else {
                            waiter.vacAdded++;
                            waiter.incrementAndCheck();
                        }
                    });
                }
                else {
                    //waiter.incrementAndCheck();
                }
            });

        }
        else {
            console.log('Cannot get page with id: ' + id + ', stop now.');
            //mongoose.disconnect();
            process.exit(1);
        }
    });
}

//getJobPage();
//getPageById(799565);
getPageById(809828);


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