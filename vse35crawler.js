// vse35 crawler
// Конвертация кодировки из 1251 в UTF8
// TODO: запилить проверку на том элементе когда прекратили гулять по сайту. нужно сохранить в файл

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
            var obj = {};

            // Основные поля без левого и правого списков
            obj.vse35Id = id;
            obj.vacancy = $('.header-desc-ad-box .title').text();
            obj.text = $('.col1 .detail_text').text().trim();
            obj.price = $('.price')["0"].children["1"].data.replace('р.', '').replace(/ /g, ''); // RU and spaces cleanup

            var addedInfo = $('.added-info')["0"];
            obj.added = addedInfo.children["3"].children["1"].children["0"].data;
            var edited = addedInfo.children["5"].children["1"].children["0"].data;
            if (edited != obj.added) {
                obj.edited = edited;
            }

            var picture = $('.preview-box')["0"];
            if (picture) {
                obj.picture = picture.children["1"].attribs.href;
            }

            var author = $('.author')["0"];
            if (author) {
                obj.author = author.children["0"].data.trim();
            }

            // Разбираем блок контактов справа
            var contactsCount = $('.contact-box .field_name').length;
            var valueRightBlock = $('.contact-box .field_value');

            // Если всего один элемент — значит телефон, иначе ещё и емейл
            if (contactsCount == 1) {
                obj.tel = valueRightBlock["1"].children["0"].data.trim();
            }
            else {
                obj.tel = valueRightBlock["2"].children["0"].data.trim();
                obj.email = valueRightBlock["3"].children["0"].data.trim();
            }

            // Разбираем блок с контентом слева
            var nameLeftBlock = $('.col1 .item_inner .item_name');
            var valueLeftBlock = $('.col1 .item_inner .item_value');

            for (var i = 0; i < nameLeftBlock.length; i++) {
                var item = nameLeftBlock[i].children["0"].data.trim();
                var itemVal = valueLeftBlock[i].children["0"].data.trim();
                switch (item) {
                    case 'Зарплата, р.':
                        obj.priceCustom = itemVal;
                        break;
                    case 'Период оплаты':
                        obj.paymentPeriod = itemVal;
                        break;
                    case 'Опыт работы':
                        obj.expirience = itemVal;
                        break;
                    case 'Занятость':
                        obj.busyness = itemVal;
                        break;
                    case 'График':
                        obj.workSchedule = itemVal;
                        break;
                    case 'Образование':
                        obj.education = itemVal;
                }
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
getPageById(799565);
//getPageById(809828);


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