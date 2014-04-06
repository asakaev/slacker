var cheerio = require('cheerio');
var request = require('request');

console.log('Connecting to DB.')
var mongoose = require('mongoose');
mongoose.connect('mongodb://ubuntu/work');
var db = mongoose.connection;
var vacanciesSchema = mongoose.Schema({
    vacancy: String,
    text: String,
    sputnikId: String,
    tel: String
});
var vacancy = mongoose.model('Vacancy', vacanciesSchema);

console.log('Getting main page from Sputnik.');
var pagesCount;
request('http://www.sputnik-cher.ru/301/', function (error, response, body) {
    if (!error && response.statusCode == 200) {
        $ = cheerio.load(body);
        var date = $('.dateBut')["1"].children["1"].children["0"].data;
        pagesCount = $('.listPrevNextPage')["0"].children["3"].attribs.href;
        pagesCount = pagesCount.replace('?p=', '');

        // странички разбираем
        for (var i = 1; i <= pagesCount; i++) {
            console.log('Run ' + i + ' page.');
            request('http://www.sputnik-cher.ru/301/?p=' + i, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    $ = cheerio.load(body);
                    var result = []; // here will be all 20 vacancies

                    var nodes = $('.itemOb');
                    nodes.each(function (index) {
                        var obj = {};
                        obj.vacancy = nodes[index].children["3"].children["0"].data;
                        var text = nodes[index].children["4"].data;
                        obj.text = text.substring(1, text.length - 7);
                        obj.sputnikId = nodes[index].children["1"].attribs.name;
                        obj.tel = nodes[index].children["5"].children["0"].data;
                        result.push(obj);
                    }); // end of DOM traversal

                    for (var item in result) {
                        var testVac = new vacancy(result[item]);
                        //console.log(result[item]);
                        testVac.save();
                    }
                }
            });
        }
    }
    console.log('Script done.');
});