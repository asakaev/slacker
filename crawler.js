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
});
var vacancy = mongoose.model('Vacancy', vacanciesSchema);

var done = 0;

function getPager(callback) {
    //top-level code
    request('http://www.sputnik-cher.ru/301/', function (error, response, body) {
        if (!error && response.statusCode == 200) {
            $ = cheerio.load(body);
            pagesCount = $('.listPrevNextPage')["0"].children["3"].attribs.href;
            pagesCount = pagesCount.replace('?p=', '');
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
                obj.tel = nodes[index].children["5"].children["0"].data;
                obj.date = date;
                //console.log(obj.vacancy);

                var testVac = new vacancy(obj);
                testVac.save();
                console.log(++done);
            }); // end of DOM traversal
        }
    });
}

function pagesLoop(pages, callback) {
    for (var i = 1; i <= 2; i++) {
        console.log('Getting page: ' + i);
        getContent(i);
    }
    callback();
}

function businessLogic() {
    //uses the above to get the work done
    console.log('Connecting to DB.');
    mongoose.connect('mongodb://ubuntu/work');
    getPager(function (pagesCount) {
        pagesLoop(pagesCount, Done);
    });
}

function Done() {
    //mongoose.disconnect();
    console.log('Done');
}

businessLogic();