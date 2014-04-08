var start = new Date().getTime();

var request = require('request');
var cheerio = require('cheerio');
var mongoose = require('mongoose');

var db = mongoose.connection;
var vacanciesSchema = mongoose.Schema({
    vacancy: String,
    text: String,
    sputnikId: String,
    tel: String,
    date: String
}, { versionKey: false });
var vacancy = mongoose.model('Vacancy', vacanciesSchema);

var vacanciesCount;
var done = 0;

function getPager(callback) {
    request('http://www.sputnik-cher.ru/301/', function (error, response, body) {
        if (!error && response.statusCode == 200) {
            $ = cheerio.load(body);
            var pagesCount = $('.listPrevNextPage')["0"].children["3"].attribs.href;
            pagesCount = parseInt(pagesCount.replace('?p=', ''));
            vacanciesCount = $('.countItemsInCategory')["0"].children["0"].data;
            vacanciesCount = parseInt(vacanciesCount.substring(22, vacanciesCount.length - 22));
            callback(pagesCount);
        }
    })
}

function getContent(pageNum) {
    request('http://www.sputnik-cher.ru/301/?p=' + pageNum, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            $ = cheerio.load(body);
            var date = $('.dateBut')["1"].children["1"].children["0"].data;
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
                new vacancy(obj).save(function () {
                    done++;
                    if (done == vacanciesCount) Done();
                });
            }); // end of DOM traversal
        }
    });
}

function pagesLoop(pages) {
    for (var i = 1; i <= pages; i++) {
        // console.log('Getting page: ' + i);
        getContent(i);
    }
}

function Done() {
    mongoose.disconnect();
    var time = new Date().getTime() - start;
    console.log(vacanciesCount + ' vacancies added in ' + time/1000 + ' sec.');
}

function Run() {
    console.log('Crawler for sputnik started.');
    mongoose.connect('mongodb://localhost/work');
    getPager(function (pagesCount) {
        pagesLoop(pagesCount);
    });
}

Run();