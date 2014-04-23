// vse35 crawler
// Конвертация кодировки из 1251 в UTF8 сделана

// TODO: там же и базу компаний хаслить. короче всё где есть электронные адреса. бесплатная реклама.
// TODO: сделать проверку по updated на сайте и у нас в базе. если разное то заменять !!!
// TODO: refactor saveVacToDB & saveResumeToDB to one function. дублирование всёровно
// TODO: оптимизировать проход. если в базе есть и обновление такое же то и не парсить поля остальные. может быстрее будет.
// TODO: не ждать парсинга. брать одну страницу за другой, а парсинг и добавление параллельно запускать (парсить только next/id)
// TODO: lastCheckedId сохранять. он только читается пока.
// TODO: if error delete from db
// TODO: done() и incAnd... проверить. похожи вроде. в одну слить.

var start = new Date().getTime();

var request = require('request');
var cheerio = require('cheerio');
var Iconv = require('iconv').Iconv;
var fromEnc = 'cp1251';
var toEnc = 'utf-8';
var translator = new Iconv(fromEnc, toEnc);
var mongoose = require('mongoose');

var extraFromDb;
var lastCheckedId;
const maxToCheck = 5;
var idWasAdded;

var db = mongoose.connection;
function getSchemaForCollection(col) {
    return mongoose.Schema({
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
    }, { versionKey: false,
        collection: col });
}

var vacanciesSchema = getSchemaForCollection('vse35vacancies');
var vacancy = mongoose.model('Vacancy', vacanciesSchema);
var resumesSchema = getSchemaForCollection('vse35resumes');
var resume = mongoose.model('Resume', resumesSchema);

var extraSchema = mongoose.Schema({
    lastCheckedId: Number,
    idWasAdded: Date
}, { versionKey: false,
    collection: 'extra'});
var extra = mongoose.model('Extra', extraSchema);


// var keeper = {}; // wait when all vacancies from sputnik saved (or checked if exist) to db
// keeper.vacCountOnPager = 0;
// keeper.vacChecked = 0;
// keeper.vacAddedToDb = 0;
// keeper.incrementAndCheck = function () {
//     if (this.vacCountOnPager == ++this.vacChecked) done();
// };

var prevCount = 0;
var prevDone = false;
var nextCount = 0;
var nextDone = false;
var topIDsCount = 0;
var topIDsChecked = 0;

function getMainPage(callback) {
    request({ url: 'http://vse35.ru/job/?print=y', encoding: null }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            $ = cheerio.load(translator.convert(body).toString());

            // смотрим id топ15 записей
            var top15 = $('.item .desc');
            var top15count = top15.length;

            if (top15count != 15) {
                console.log('WRN: Top 15 structure is changed!');
                // TODO: exit if error here
            }

            var topId = top15["0"].children["1"].children["0"].attribs.href;
            topId = parseInt(topId.split('=')["1"]);

            // If there is date in DB then update it, else create new
            if (extraFromDb) {
//                extraFromDb.lastCheckedId = topId;
                extraFromDb.idWasAdded = new Date();
                extraFromDb.save();
            } else {
                new extra({ lastCheckedId: topId, idWasAdded: new Date() }).save();
            }

            var arr = [];
            var idx;
            // Check if there is something we already know in top15
            for (idx = 0; idx < top15count; idx++) {
                var id = top15[idx].children["1"].children["0"].attribs.href;
                id = parseInt(id.split('=')["1"]);

                if (id != lastCheckedId) {
                    arr.push(id);
                } else {
                    break;
                }
            }

            if (callback) {
                // If all new then just topId else arr with NEW IDs
                if (idx == top15count) {
                    callback(topId);
                } else {
                    callback(topId, arr);
                }
            }
        }
    })
}

function getPageById(id, isTopBurst, callback) {
    request({ url: 'http://vse35.ru/job/element.php?print=y&eid=' + id, encoding: null }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            $ = cheerio.load(translator.convert(body).toString());
            var obj = {};

            // Основные поля без левого и правого списков
            obj.vse35Id = id;
            var vac = $('.header-desc-ad-box .title').text();
            if (vac == '') {
                var extraVac = $('.st_title .title')["1"].children["0"].data;
                var extraVacBegin = extraVac.substring(0, 6);
                if (extraVacBegin != ' - зп ') {
                    obj.vacancy = extraVac;
                }
            } else {
                obj.vacancy = vac;
            }

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
                var authorTitle = authorDetail.children["0"].attribs.href;
                if (authorTitle != '') {
                    obj.authorDetailName = authorDetail.children["0"].children["0"].data;
                    var tmp = authorDetail.children["0"].attribs.href;
                    obj.authorDetailId = parseInt(tmp.split('=')["1"]);
                }
            }

            // Разбираем блок контактов справа
            var nameRightBlock = $('.contact-box .field_name');
            var valueRightBlock = $('.contact-box .field_value');

            if (author) {
                valueRightBlock.splice(0, 1); // если автор есть то выкидываем его, иначе мешает с телефоном/емейлом
            }

            var thereWasPhone;
            for (var i = 0; i < nameRightBlock.length; i++) {
                var item = nameRightBlock[i].children["0"].data;
                switch (item) {
                    case 'Телефон':
                        thereWasPhone = true;
                        obj.tel = valueRightBlock[i + 1].children["0"].data.trim();
                        break;
                    case 'Email':
                        if (thereWasPhone) {
                            obj.email = valueRightBlock[i + 1].children["0"].data.trim();
                        }
                        else {
                            obj.email = valueRightBlock[i].children["0"].data.trim();
                        }
                }
            }

            var infoBox = addedInfo.find('li');
            obj.visitors = infoBox[infoBox.length - 1].children["1"].children["0"].data;

            // Разбираем блок с контентом слева
            var nameLeftBlock = $('.col1 .item_inner .item_name');
            var valueLeftBlock = $('.col1 .item_inner .item_value');

            var isVacancy;

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
                        break;
                    case 'Тип объявления':
                        if (itemVal == 'Вакансия') {
                            isVacancy = true;
                        }
                }
            }

            saveToDB(obj, isTopBurst, isVacancy);

            var next = $('.next');
            var nextId = 0;
            if (next.length != 0) {
                nextId = next["0"].children["0"].attribs.href;
                nextId = parseInt(nextId.split('=')["1"]);
            }

            var prev = $('.prev');
            var prevId = 0;
            if (prev.length != 0) {
                prevId = prev["0"].children["0"].attribs.href;
                prevId = parseInt(prevId.split('=')["1"]);
            }

            if (callback) callback(prevId, nextId);
        } // end if connect success
        else {
            console.log('Cannot get page with id: ' + id + ', stop now.');
            //mongoose.disconnect();
            process.exit(1);
        }
    });
}

function saveVacancy(obj, isTopBurst) {
    new vacancy(obj).save(function (err) {
        if (err) {
            console.log(err);
            //mongoose.disconnect();
            process.exit(1);
        }
        else {
            console.log('Added to db: ' + obj.vse35Id);
            if (isTopBurst) incAndCheckTopBurst();
        }
    });
}

function saveResume(obj, isTopBurst) {
    new resume(obj).save(function (err) {
        if (err) {
            console.log(err);
            //mongoose.disconnect();
            process.exit(1);
        }
        else {
            console.log('Added resume to db: ' + obj.vse35Id);
            if (isTopBurst) incAndCheckTopBurst();
        }
    });
}

function saveToDB(obj, isTopBurst, isVacancy) {
    vacancy.findOne({'vse35Id': obj.vse35Id}, function (err, id) {
        if (err) {
            console.log(err);
            //mongoose.disconnect();
            process.exit(1);
        }
        var text = isVacancy ? 'Vacancy' : 'Resume';

        if (id) {
            console.log(text + ' with id ' + obj.vse35Id + ' is already here.');
            if (isTopBurst) incAndCheckTopBurst();
        } else {
            if (isVacancy) {
                saveVacancy(obj, isTopBurst);
            } else {
                saveResume(obj, isTopBurst);
            }
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

function chainerPrev(idStart) {
    getPageById(idStart, false, function (prev, next) {
        prevCount++;
        console.log('Count: ' + prevCount + ' this id: ' + idStart + ', prev: ' + prev);

        if ((prev != 0) && (prevCount < maxToCheck)) {
            chainerPrev(prev);
        }
        else {
            console.log('We went back [<<] and got ' + prevCount + ' pages.');
            prevDone = true;
            done();
        }
    });
}

function chainerNext(idStart) {
    getPageById(idStart, false, function (prev, next) {
        nextCount++;
        console.log('Count: ' + nextCount + ', next: ' + next);

        if ((next != 0) && (nextCount < maxToCheck)) {
            chainerNext(next);
        }
        else {
            console.log('We went forward [>>] and ' + nextCount + ' pages got.');
            nextDone = true;
            done();
        }
    });
}

function incAndCheckTopBurst() {
    if (++topIDsChecked == topIDsCount) {
        done('burst');
    }
}

function checkChainerIsDone() {
    //prevDone && nextDone
}

function done(param) {
    var time = (new Date().getTime() - start) / 1000;
    time = time < 60 ? time + ' sec.' : time / 60 + ' min.';

    if (param === 'burst') {
        console.log('Done burst in ' + time);
    } else if (param === 'chainer') {
        console.log('Done chainer in ' + time);
    }

    mongoose.disconnect(function () {
        process.exit(0);
    });
}

function getLastCheckedId(callback) {
    var query = extra.findOne();
    query.where('lastCheckedId').ne(null);
    query.exec(function (err, res) {
        if (err) console.log(err);
        extraFromDb = res;

        // If there is last update Date in DB then use it, otherwise null
        if (extraFromDb) {
            lastCheckedId = extraFromDb.lastCheckedId;
            idWasAdded = extraFromDb.idWasAdded;
            console.log('The last time top ID was ' + lastCheckedId + '.');
        } else {
            console.log('There is no last updated ID in database.');
        }
        if (callback) callback();
    });
}

function runBurstOrChainer(id, topIDs) {
    if (false) {
//    if (topIDs) {
        topIDsCount = topIDs.length;
        if (topIDsCount == 0) {
            console.log('Nothing new since ' + idWasAdded + '.');
            done();
        } else {
            var isAre = topIDsCount == 1 ? ' is ' : ' are ';
            console.log('There' + isAre + topIDsCount + ' fresh vacancies on main page since '
                + idWasAdded + ' and top ID is ' + id + '.');

            var i;
            for (i = 0; i < topIDsCount; i++) {
                getPageById(topIDs[i], true);
            }
        }
    } else {
        chainerPrev(id);
        chainerNext(id);
    }
}

function main() {
    console.log('Crawler for Vse35 started.');
    mongoose.connect('mongodb://localhost/work', function (err) {
        if (err) {
            console.log(err);
            process.exit(1);
        }

        getLastCheckedId(function () {
            getMainPage(function (id, topIDs) {
                runBurstOrChainer(id, topIDs);
            });
        });
    });
}

main();