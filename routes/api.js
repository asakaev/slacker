var mongoose = require('mongoose');
var vacancy = mongoose.model('Vacancy', sputnikSchema);

function replaceAllBackSlash(targetStr) {
    var index = targetStr.indexOf("\\");
    while (index >= 0) {
        targetStr = targetStr.replace("\\", '');
        index = targetStr.indexOf("\\");
    }
    return targetStr;
}

exports.dbGetJSON = function (req, res) {

    if (typeof req.query.q === 'undefined') {
        res.jsonp([]);
    }
    else {
        var clean = replaceAllBackSlash(req.query.q);
        if (clean === '') {
            res.jsonp([]);
        }
        else {
            vacancy.find({ vacancy: new RegExp(clean, 'i') }, '-sputnikId -_id', function (err, vacancies) {
                if (err) return console.error(err);
                res.jsonp(vacancies);
            }); // end vacancies find
        }
    }
};