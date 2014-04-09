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

// Читаем когда последний раз на спутнике обновление было
fs.readFile('sputnikLastUpdate.txt', 'utf-8', function read(err, data) {
    if (err) {
        console.log(err);
        process.exit(1);
    }
    sputnikLastUpdate = data;
});

var db = mongoose.connection;
var vacanciesSchema = mongoose.Schema({
    vacancy: String,
    text: String,
    sputnikId: String,
    tel: String,
    date: String
}, { versionKey: false });
var vacancy = mongoose.model('Vacancy', vacanciesSchema);

var waiter = {}; // ждёт пока все вакансии с сайта добавятся в базу и отключается как только всё
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
                process.exit(1);
            }
            else {
                fs.writeFile('sputnikLastUpdate.txt', date, function (err) {
                    if (err) {
                        console.log(err);
                        process.exit(1);
                    }
                });
            }

            var pagesCount = $('.listPrevNextPage')["0"].children["3"].attribs.href;
            pagesCount = parseInt(pagesCount.replace('?p=', ''));
            waiter.vacCount = $('.countItemsInCategory')["0"].children["0"].data;
            waiter.vacCount = parseInt(waiter.vacCount.substring(22, waiter.vacCount.length - 22));
            callback(pagesCount);
        }
        else {
            console.log('Cannot get Sputnik pager.');
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
                obj.date = date;
                // save to db

                vacancy.findOne({'sputnikId': obj.sputnikId}, function (err, id) {
                    if (err) {
                        console.log(err);
                        process.exit(1);
                    }

                    // если такой записи нет то сохраняем
                    if (!id) {
                        new vacancy(obj).save(function (err) {
                            if (err) {
                                console.log(err);
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