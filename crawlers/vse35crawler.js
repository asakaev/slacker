// vse35 crawler
// Конвертация кодировки из 1251 в UTF8 сделана

// TODO: сделать проверку по updated на сайте и у нас в базе. если разное то заменять !!!
// TODO: оптимизировать проход. если в базе есть и обновление такое же то и не парсить поля остальные. может быстрее будет.
// TODO: не ждать парсинга. брать одну страницу за другой, а парсинг и добавление параллельно запускать (парсить только next/id)
// TODO: lastCheckedId сохранять. он только читается пока.
// TODO: if error delete from db
// TODO: done() и incAnd... проверить. похожи вроде. в одну слить.

// TODO: убрать лишний код который о резюме. отдельный бот лучше будет пусть который будет собирать контакты. иначе не ясно где что.

var start = new Date().getTime();

var request = require('request');
var cheerio = require('cheerio');
var Iconv = require('iconv').Iconv;
var translator = new Iconv('cp1251', 'utf-8');
var mongoose = require('mongoose');

var extraFromDB;
var lastCheckedId;
var idWasAdded;
var topId;
const maxToCheck = 1000;

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

var extraSchema = mongoose.Schema({
    lastCheckedId: Number,
    idWasAdded: Date
}, { versionKey: false,
    collection: 'extra'});
var extra = mongoose.model('Extra', extraSchema);

var bK = {}; // Burst Keeper
bK.checked = 0;
bK.added = 0;
bK.check = function () {
    if (++this.checked == 15) {
        done('burst');
    }
};

var cK = {}; // Chainer Keeper
cK.prevDone = false;
cK.nextDone = false;
cK.prevCount = 0;
cK.nextCount = 0;
cK.added = 0;
cK.check = function () {
    if (this.prevDone && this.nextDone) {
        done('chainer');
    }
};

function updateExtra(callback) {
    // If there is date in DB then update it, else create new
    if (extraFromDB) {
        extraFromDB.lastCheckedId = topId;
        extraFromDB.idWasAdded = new Date();
        extraFromDB.save(function () {
            if (callback) callback();
        });
    } else {
        new extra({ lastCheckedId: topId, idWasAdded: new Date() }).save(function () {
            if (callback) callback();
        });
    }
}

function checkTop15(top15) {
    var arr = [];
    var lastCheckedFinded = false;

    // Check if there is something we already know in top15
    for (var i = 0; i < top15.length; i++) {
        var id = top15[i].children["1"].children["0"].attribs.href;
        id = parseInt(id.split('=')["1"]);
        arr.push(id);
        if (id != lastCheckedId) {
            lastCheckedFinded = true;
        }
    }

    if (lastCheckedFinded) {
        return arr;
    } else {
        return false;
    }
}

function getMainPage(callback) {
    request({ url: 'http://vse35.ru/job/?print=y', encoding: null }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            $ = cheerio.load(translator.convert(body).toString());
            var top15 = $('.item .desc');

            if (top15.length != 15) {
                console.log('WRN: Top 15 structure is changed!');
                // TODO: exit if error here
            }

            topId = top15["0"].children["1"].children["0"].attribs.href;
            topId = parseInt(topId.split('=')["1"]);

            var res = checkTop15(top15);
            if (callback) callback(res);
        }
    })
}

function getPageById(id, isTopBurst, callback) {
    request({ url: 'http://vse35.ru/job/element.php?print=y&eid=' + id, encoding: null }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            $ = cheerio.load(translator.convert(body).toString());
            var obj = {};

            // Разбираем блок с контентом слева
            var nameLeftBlock = $('.col1 .item_inner .item_name');
            var valueLeftBlock = $('.col1 .item_inner .item_value');

            var isVacancy;
            for (i = 0; i < nameLeftBlock.length; i++) {
                var itemLeftBlock = nameLeftBlock[i].children["0"].data.trim();
                var itemVal = valueLeftBlock[i].children["0"].data.trim();
                switch (itemLeftBlock) {
                    case 'Тип объявления':
                        if (itemVal == 'Вакансия') {
                            isVacancy = true;
                        }
                        break;
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


            if (isVacancy) {
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
                var i;
                for (i = 0; i < nameRightBlock.length; i++) {
                    var itemRightBlock = nameRightBlock[i].children["0"].data;
                    switch (itemRightBlock) {
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

                saveVacancy(obj, isTopBurst);
            } else {
                if (isTopBurst) {
                    bK.check();
                }
            }

            if (callback) {
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
                callback(prevId, nextId);
            }
        } // end if connect success
        else {
            console.log('Cannot get page with id: ' + id + ', stop now.');
            //mongoose.disconnect();
            process.exit(1);
        }
    });
}

function saveVacancy(obj, isTopBurst) {
    vacancy.findOne({'vse35Id': obj.vse35Id}, function (err, id) {
        if (err) {
            console.log(err);
            //mongoose.disconnect();
            process.exit(1);
        }

        if (id) {
//            console.log('Vacancy with id ' + obj.vse35Id + ' is already here.');
            if (isTopBurst) bK.check();
        } else {
            new vacancy(obj).save(function (err) {
                if (err) {
                    console.log(err);
                    //mongoose.disconnect();
                    process.exit(1);
                }

                console.log('Added vacancy to db: ' + obj.vse35Id);
                if (isTopBurst) {
                    bK.added++;
                    bK.check();
                } else {
                    cK.added++;
                }
            });
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

function chainerPrev(id) {
    getPageById(id, false, function (prev, next) {
        cK.prevCount++;
//        console.log('Prev count: ' + cK.prevCount + ' this id: ' + id + ', prev: ' + prev);

        if ((prev != 0) && (cK.prevCount < maxToCheck)) {
            chainerPrev(prev);
        }
        else {
//            console.log('We went back [<<] and got ' + cK.prevCount + ' pages.');
            cK.prevDone = true;
            cK.check();
        }
    });
}

function chainerNext(id) {
    getPageById(id, false, function (prev, next) {
        cK.nextCount++;
//        console.log('Next count: ' + cK.nextCount + ' this id: ' + id + ', next: ' + next);

        if ((next != 0) && (cK.nextCount < maxToCheck)) {
            chainerNext(next);
        }
        else {
//            console.log('We went forward [>>] and got ' + cK.nextCount + ' pages.');
            cK.nextDone = true;
            cK.check();
        }
    });
}

function done(param) {
    var time = (new Date().getTime() - start) / 1000;
    time = time < 60 ? time + ' sec.' : time / 60 + ' min.';

    if (param === 'burst') {
        var text = 'Nothing';
        if (bK.added > 0) {
            text = 'Found ' + bK.added;
        }
        console.log(text + ' new in TOP15. Burst done in ' + time);
    } else if (param === 'chainer') {
        var total = cK.prevCount + cK.nextCount;
        console.log('There was ' + cK.added + '/' + total + ' (' + cK.prevCount + ' PREV and ' + cK.nextCount +
            ' NEXT) records added' + ' in ' + time);
    }

    updateExtra(function () {
        mongoose.disconnect(function () {
            process.exit(0);
        });
    });
}

function getLastCheckedId(callback) {
    var query = extra.findOne();
    query.where('lastCheckedId').ne(null);
    query.exec(function (err, res) {
        if (err) console.log(err);
        extraFromDB = res;

        // If there is last update Date in DB then use it, otherwise null
        if (extraFromDB) {
            lastCheckedId = extraFromDB.lastCheckedId;
            idWasAdded = extraFromDB.idWasAdded;
            console.log('The last time top ID was ' + lastCheckedId + '.');
        } else {
            console.log('There is no last updated ID in database.');
        }
        if (callback) callback();
    });
}

function runBurstOrChainer(topIDs) {
    if (false) {
//    if (topIDs) {
        console.log('There is ID that we already know in Top15 so running parallel burst.');

        for (var i = 0; i < 15; i++) {
            getPageById(topIDs[i], true);
        }

    } else {
        console.log('Running chainer so please wait...');
        chainerPrev(topId);
        chainerNext(topId);
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