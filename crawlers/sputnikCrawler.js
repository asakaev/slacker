// Берем страницу с датой, кол-вом вакансий (899) и кол-вом страниц (45)
// В цикле берем все страницы (45) и ищем на них дивы в которых нужный контент (от 1 до 20)
// Каждое из объявлений сразу же добавляем в базу к себе, если такого ещё нет (проверка по sputnikId)
// Как только все 899 попыток записать в базу выполнены — отключаемся, пишем результаты.

var start = new Date().getTime();

var request = require('request');
var cheerio = require('cheerio');
var mongoose = require('mongoose');
var fs = require('fs');

var sputnikLastUpdate;
var date;

// get last sputnik website update
fs.readFile('sputnikLastUpdate.txt', 'utf-8', function read(err, data) {
    if (err) {
        console.log(err);
        mongoose.disconnect();
        process.exit(1);
    }
    sputnikLastUpdate = data;
});

var db = mongoose.connection;
var sputnikSchema = mongoose.Schema({
    vacancy: String,
    text: String,
    sputnikId: Number,
    tel: String,
    added: Date
},{ versionKey: false,
    collection: 'sputnik'});

var vacancy = mongoose.model('Vacancy', sputnikSchema);

var waiter = {}; // wait when all vacancies from sputnik saved (or checked if exist) to db
waiter.vacCount = 0;
waiter.vacChecked = 0;
waiter.vacAdded = 0;
waiter.incrementAndCheck = function () {
    if (this.vacCount == ++this.vacChecked) done();
};

function getPager(callback) {
    request('http://www.sputnik-cher.ru/301/', function (error, response, body) {
        if (!error && response.statusCode == 200) {
            $ = cheerio.load(body);
            date = $('.dateBut')["1"].children["1"].children["0"].data;

            if (date == sputnikLastUpdate) {
                console.log('Last update was ' + date + ' and we already parsed it.');
                mongoose.disconnect();
                process.exit(1);
            }
            else {
                fs.writeFile('sputnikLastUpdate.txt', date, function (err) {
                    if (err) {
                        console.log(err);
                        mongoose.disconnect();
                        process.exit(1);
                    }
                });
            }
            date = convertDate(date);

            var pagesCount = $('.listPrevNextPage')["0"].children["3"].attribs.href;
            pagesCount = parseInt(pagesCount.replace('?p=', ''));
            waiter.vacCount = $('.countItemsInCategory')["0"].children["0"].data;
            waiter.vacCount = parseInt(waiter.vacCount.substring(22, waiter.vacCount.length - 22));

            var nodes = $('.itemOb');
            if (nodes.length != 20) {
                console.log('WRN: 20 vacancies on page structure is changed!');
            }

            callback(pagesCount);
        }
        else {
            console.log('Cannot get Sputnik pager.');
            mongoose.disconnect();
            process.exit(1);
        }
    })
}

function getContent(pageNum) {
    request('http://www.sputnik-cher.ru/301/?p=' + pageNum, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            $ = cheerio.load(body);
            var nodes = $('.itemOb');
            nodes.each(function (index) {
                var obj = {};
                obj.vacancy = nodes[index].children["3"].children["0"].data;
                var text = nodes[index].children["4"].data;
                obj.text = text.substring(1, text.length - 7);
                obj.sputnikId = nodes[index].children["1"].attribs.name;
                if (nodes[index].children["5"].children["0"] !== undefined) {
                    obj.tel = nodes[index].children["5"].children["0"].data;
                }
                obj.added = date;

                // find if exist and save to db
                vacancy.findOne({'sputnikId': obj.sputnikId}, function (err, id) {
                    if (err) {
                        console.log(err);
                        mongoose.disconnect();
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
                        waiter.incrementAndCheck();
                    }
                });

            }); // end of DOM traversal
        }
        else {
            console.log('Cannot get page ' + pageNum + ', stop now.');
            mongoose.disconnect();
            process.exit(1);
        }
    });
}

function pagesLoop(pages) {
    for (var i = 1; i <= pages; i++) {
        getContent(i);
    }
}

function done() {
    mongoose.disconnect();
    var time = new Date().getTime() - start;
    console.log(waiter.vacCount + ' vacancies checked and ' + waiter.vacAdded + ' new added to DB in ' + time / 1000 + ' sec.');
}

function convertDate(strInput) {
    // 5 марта 2008
    var splitted = strInput.split(' ');

    var dt = parseInt(splitted["0"]);
    var mon;
    var yr = parseInt(splitted["2"]);

    switch (splitted["1"]) {
        case 'января':
            mon = 1;
            break;
        case 'февраля':
            mon = 2;
            break;
        case 'марта':
            mon = 3;
            break;
        case 'апреля':
            mon = 4;
            break;
        case 'мая':
            mon = 5;
            break;
        case 'июня':
            mon = 6;
            break;
        case 'июля':
            mon = 7;
            break;
        case 'августа':
            mon = 8;
            break;
        case 'сентября':
            mon = 9;
            break;
        case 'октября':
            mon = 10;
            break;
        case 'ноября':
            mon = 11;
            break;
        case 'декабря':
            mon = 12;
    }
    return new Date(yr, mon - 1, dt);
}

function run() {
    console.log('Crawler for sputnik started.');
    mongoose.connect('mongodb://localhost/work', function (err) {
        if (err) {
            console.log(err);
            process.exit(1);
        }
    });

    getPager(function (pagesCount) {
        pagesLoop(pagesCount);
    });
}

run();