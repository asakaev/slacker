// vse35 crawler
// Конвертация кодировки из 1251 в UTF8
// TODO: запилить проверку на том элементе когда прекратили гулять по сайту. нужно сохранить в файл
// TODO: похоже только полный перебор. нет не только. на первой вылезают объявы которые апдейтет даже.

// var start = new Date().getTime();

var request = require('request');
var cheerio = require('cheerio');
var Iconv = require('iconv').Iconv;
var fromEnc = 'cp1251';
var toEnc = 'utf-8';
var translator = new Iconv(fromEnc, toEnc);
var mongoose = require('mongoose');
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
    console.log('Last added: ' + lastAddedVacancyId);
});

var db = mongoose.connection;
var vacanciesSchema = mongoose.Schema({
    vse35Id: Number,
    vacancy: String,
    text: String,
    price: Number,
    priceCustom: String,
    added: Date,
    edited: Date,
    author: String,
    tel: String,
    email: String,
    visitors: Number,
    paymentPeriod: String,
    experience: String,
    education: String,
    busyness: String,
    workSchedule: String,
    picture: String,
    authorDetailName: String,
    authorDetailId: Number
}, { versionKey: false });
var vacancy = mongoose.model('Vacancy', vacanciesSchema);

// var waiter = {}; // wait when all vacancies from sputnik saved (or checked if exist) to db
// waiter.vacCount = 0;
// waiter.vacChecked = 0;
// waiter.vacAdded = 0;
// waiter.incrementAndCheck = function () {
//     if (this.vacCount == ++this.vacChecked) done();
// };

//var categoriesCount;
var totalVacancies = 0;

function getJobPage(callback) {
    request({ url: 'http://vse35.ru/job/?print=y', encoding: null }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            $ = cheerio.load(translator.convert(body).toString());

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
                id = parseInt(id.substring(21, id.length));
                console.log(index + ': ' + id);


                if (id == lastAddedVacancyId) {
                    console.log('Stopped cause this id already added. * Kind of lol.');
                    break;
                }

                // если последний элемент
                if (index == top15count - 1) {
                    // chain fx if last
                }
                else {
                    // everyday code fx
                    getPageById(id);
                }
            }
        }
    })
}

function getPageById(id, callback) {
    request({ url: 'http://vse35.ru/job/element.php?print=y&eid=' + id, encoding: null }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            $ = cheerio.load(translator.convert(body).toString());
            var obj = {};

            // Основные поля без левого и правого списков
            obj.vse35Id = id;
            obj.vacancy = $('.header-desc-ad-box .title').text();
            obj.text = $('.col1 .detail_text').text().trim();

            obj.price = $('.price')["0"];
            if (obj.price) {
                obj.price = obj.price.children["1"].data.replace('р.', '').replace(/ /g, ''); // RU and spaces cleanup
            }

            var addedInfo = $('.added-info');
            obj.added = addedInfo["0"].children["3"].children["1"].children["0"].data;

            var edited = addedInfo["0"].children["5"].children["1"].children["0"].data;
            if (edited != obj.added) {
                obj.edited = convertDate(edited);
            }
            obj.added = convertDate(obj.added);

            var picture = $('.preview-box')["0"];
            if (picture) {
                obj.picture = picture.children["1"].attribs.href;
            }

            var author = $('.author')["0"];
            if (author) {
                obj.author = author.children["0"].data.trim();
            }

            var authorDetail = $('.contact-box .title')["0"];
            if (authorDetail) {
                obj.authorDetailName = authorDetail.children["0"].children["0"].data;
                var tmp = authorDetail.children["0"].attribs.href;
                obj.authorDetailId = tmp.substring(tmp.length - 6, tmp.length);
            }

            // Разбираем блок контактов справа
            var contactsCount = $('.contact-box .field_name').length;
            var valueRightBlock = $('.contact-box .field_value');

            if (author) {
                valueRightBlock.splice(0, 1); // если автор есть то выкидываем его, иначе мешает с телефоном/емейлом
            }

            // Если всего один элемент — значит телефон, иначе ещё и емейл
            if (contactsCount == 1) {
                obj.tel = valueRightBlock["1"].children["0"].data.trim();
            }
            else {
                obj.tel = valueRightBlock["1"].children["0"].data.trim();
                obj.email = valueRightBlock["2"].children["0"].data.trim();
            }

            var infoBox = addedInfo.find('li');
            obj.visitors = infoBox[infoBox.length - 1].children["1"].children["0"].data;

            // Разбираем блок с контентом слева
            var nameLeftBlock = $('.col1 .item_inner .item_name');
            var valueLeftBlock = $('.col1 .item_inner .item_value');

            for (var i = 0; i < nameLeftBlock.length; i++) {
                var item = nameLeftBlock[i].children["0"].data.trim();
                var itemVal = valueLeftBlock[i].children["0"].data.trim();
                switch (item) {
                    case 'Зарплата, р.':
                        if (itemVal != obj.price) {
                            obj.priceCustom = itemVal;
                        }
                        break;
                    case 'Период оплаты':
                        obj.paymentPeriod = itemVal;
                        break;
                    case 'Опыт работы':
                        obj.experience = itemVal;
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
            //console.log(obj);
            saveToDb(obj);

            var next = $('.next');
            var nextId;

            // Если дальше ничего нет
            if (next.length == 0) {
                nextId = 0;
            } else {
                nextId = next["0"].children["0"].attribs.href;
                nextId = parseInt(nextId.substring(nextId.length - 6, nextId.length));
                console.log('Next is ' + nextId);
            }

            if (callback) {
                callback(nextId);
            }
        } // if connect success end
        else {
            console.log('Cannot get page with id: ' + id + ', stop now.');
            //mongoose.disconnect();
            process.exit(1);
        }
    });
}

//getJobPage();


// function done() {
//     mongoose.disconnect();
//     var time = new Date().getTime() - start;
//     console.log(waiter.vacCount + ' vacancies checked and ' + waiter.vacAdded + ' new added to DB in ' + time / 1000 + ' sec.');
// }

function saveToDb(obj) {
    // find if exist and save to db
    vacancy.findOne({'vse35Id': obj.vse35Id}, function (err, id) {
        if (err) {
            console.log(err);
            //mongoose.disconnect();
            process.exit(1);
        }

        console.log('DB ID: ' + id);

        // if not found then save to db
        if (!id) {
            new vacancy(obj).save(function (err) {
                if (err) {
                    console.log(err);
                    //mongoose.disconnect();
                    process.exit(1);
                }
                else {
                    console.log('Added to db: ' + obj.vse35Id);
                    //waiter.vacAdded++;
                    //waiter.incrementAndCheck();
                }
            });
        }
        else {
            console.log('Already here id: ' + obj.vse35Id);
            //waiter.incrementAndCheck();
        }
    });
}

function convertDate(strInput) {
    // dd/mm/yyyy
    var dt = parseInt(strInput.substring(0, 2));
    var mon = parseInt(strInput.substring(3, 5));
    var yr = parseInt(strInput.substring(6, 10));
    return new Date(yr, mon - 1, dt);
}

var globCount = 0;

function chainer(idStart) {
    getPageById(idStart, function (next) {
        globCount++;
        console.log('Count: ' + globCount + ', next: ' + next);

        if ((next != 0) && (globCount < 10)) {
            console.log('inside');
            chainer(next);
        }
        console.log('ok');
    });
}

function run() {
    console.log('Crawler for vse35 started.');
    mongoose.connect('mongodb://localhost/vse35', function (err) {
        if (err) {
            console.log(err);
            process.exit(1);
        }
    });
    //getJobPage();
    //getPageById(809890);
    //chainer(809890);
}

run();
chainer(809890);
//console.log('test: ' + getPageById(809890));

//function recur(input) {
//    var a = input + 1;
//    console.log(a);
//
//    if (a < 30) {
//        recur(a);
//    }
//}
//
//recur(1);