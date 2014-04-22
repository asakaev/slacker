// Берем страницу с датой, кол-вом вакансий (899) и кол-вом страниц (45)
// В цикле берем все страницы (45) и ищем на них дивы в которых нужный контент (от 1 до 20)
// Каждое из объявлений сразу же добавляем в базу к себе, если такого ещё нет (проверка по idSputnik)
// Как только все 899 попыток записать в базу выполнены — отключаемся, пишем результаты.

// TODO: Нет полного собирания всех номеров к себе в базу. А надо бы для статистики, да и емейлы там могут быть

var start = new Date().getTime();

var request = require('request');
var cheerio = require('cheerio');
var mongoose = require('mongoose');
var colors = require('colors');

var extraFromDb;
var date;
var issue;
var dateFromDb;

var db = mongoose.connection;
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

var extraSchema = mongoose.Schema({
    updatedSputnik: Date
}, { versionKey: false,
    collection: 'extra'});
var extra = mongoose.model('Extra', extraSchema);

var keeper = {}; // Wait when all vacancies from sputnik saved (or checked if exist) to DB
keeper.vacCountOnPager = 0;
keeper.vacChecked = 0;
keeper.vacAddedToDb = 0;
keeper.incrementAndCheck = function () {
    if (this.vacCountOnPager == ++this.vacChecked) done();
};

function getPagerWithDate(callback) {
    request('http://www.sputnik-cher.ru/301/', function (error, response, body) {
        if (!error && response.statusCode == 200) {
            $ = cheerio.load(body);
            date = $('.dateBut')["0"].children["1"].children["0"].data;
            date = convertDate(date);

            if (date.toString() == dateFromDb) {
                shutDownWithMsg('[OK]'.green + ' Last update was ' + date + ' and we already parsed it.');
            }
            else {
                // If there is date in DB then update it, else create new
                if (extraFromDb) {
                    extraFromDb.updatedSputnik = date;
                    extraFromDb.save();
                } else {
                    new extra({ updatedSputnik: date }).save();
                }
            }

            issue = $('.butText')["0"].children["1"].children["0"].data;
            issue = parseInt(issue.substring(1));

            var pagesCount = $('.listPrevNextPage')["0"].children["3"].attribs.href;
            pagesCount = parseInt(pagesCount.replace('?p=', ''));
            keeper.vacCountOnPager = $('.countItemsInCategory')["0"].children["0"].data;
            keeper.vacCountOnPager = parseInt(keeper.vacCountOnPager.substring(22, keeper.vacCountOnPager.length - 22));

            var nodes = $('.itemOb');
            if (nodes.length != 20) {
                shutDownWithMsg('[ERR]'.red + ' 20 vacancies on page structure is changed!', true);
            }
            callback(pagesCount);
        }
        else {
            shutDownWithMsg('[ERR]'.red + ' Cannot get Sputnik pager.');
        }
    })
}

function getAndParsePage(pageNum) {
    request('http://www.sputnik-cher.ru/301/?p=' + pageNum, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            $ = cheerio.load(body);
            var nodes = $('.itemOb');
            nodes.each(function (i) {
                var obj = {};
                obj.vacancy = nodes[i].children["3"].children["0"].data;
                obj.text = nodes[i].children["4"].data.trim();
                obj.idSputnik = nodes[i].children["1"].attribs.name;
                if (nodes[i].children["5"].children["0"] !== undefined) {
                    obj.tel = nodes[i].children["5"].children["0"].data;
                }
                obj.added = date;
                obj.issue = issue;

                // Find if exist and save to DB
                vacancy.findOne({'idSputnik': obj.idSputnik}, function (err, id) {
                    if (err) shutDownWithMsg(err);

                    // If not found then save to DB
                    if (!id) {
                        new vacancy(obj).save(function (err) {
                            if (err) {
                                shutDownWithMsg(err, true);
                            }
                            else {
                                keeper.vacAddedToDb++;
                                keeper.incrementAndCheck();
                            }
                        });
                    }
                    else {
                        keeper.incrementAndCheck();
                    }
                });
            }); // End of each div on page parsing
        }
        else {
            shutDownWithMsg('[ERR]'.red + ' Cannot get page ' + pageNum + ', stop now.', true);
        }
    });
}

function pagesLoop(pages) {
    for (var i = 1; i <= pages; i++) {
        getAndParsePage(i);
    }
}

function convertDate(strInput) {
    var splitted = strInput.split(' '); // 5 марта 2008

    var day = parseInt(splitted["0"]);
    var mon;
    var year = parseInt(splitted["2"]);

    switch (splitted["1"]) {
        case 'января':
            mon = 0;
            break;
        case 'февраля':
            mon = 1;
            break;
        case 'марта':
            mon = 2;
            break;
        case 'апреля':
            mon = 3;
            break;
        case 'мая':
            mon = 4;
            break;
        case 'июня':
            mon = 5;
            break;
        case 'июля':
            mon = 6;
            break;
        case 'августа':
            mon = 7;
            break;
        case 'сентября':
            mon = 8;
            break;
        case 'октября':
            mon = 9;
            break;
        case 'ноября':
            mon = 10;
            break;
        case 'декабря':
            mon = 11;
    }
    return new Date(year, mon, day);
}

function done() {
    var time = (new Date().getTime() - start) / 1000;
    var info;
    if (keeper.vacCountOnPager == keeper.vacAddedToDb) {
        info = '[OK]'.green + ' All ' + keeper.vacCountOnPager + ' vacancies checked and added to DB in ' + time + ' sec.';
    }
    else {
        info = '[OK]'.green + ' ' + keeper.vacCountOnPager + ' vacancies checked and ' + keeper.vacAddedToDb + ' new added to DB in ' + time + ' sec.';
    }
    shutDownWithMsg(info);
}

function shutDownWithMsg(msg, removeUpdateFromDb) {
    if (msg) console.log(msg);

    // If there was a problem
    if (removeUpdateFromDb) {
        if (extraFromDb) {
            extraFromDb.remove(function () {
                mongoose.disconnect(function () {
                    process.exit(1);
                });
            });
        }
    } else {
        mongoose.disconnect(function () {
            process.exit(0);
        });
    }
}

function main() {
    console.log('Crawler for sputnik started.');
    mongoose.connect('mongodb://localhost/work', function (err) {
        if (err) shutDownWithMsg(err);
    });

    // Get last Sputnik website update
    var query = extra.findOne();
    query.where('updatedSputnik').ne(null);
    query.exec(function (err, res) {
        if (err) shutDownWithMsg(err);
        extraFromDb = res;

        // If there is last update Date in DB then use it, otherwise null
        if (extraFromDb) {
            dateFromDb = extraFromDb.updatedSputnik;
        }

        // Get main Sputnik page with pages count and Date then parse it
        getPagerWithDate(function (pagesCount) {
            pagesLoop(pagesCount);
        });
    });
}

main();