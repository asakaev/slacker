exports.myjson =  function(req, res){
    console.log(req.query.q);
    if (req.query.q == 'cat')
    {
        res.jsonp({ result: 'Yea cat lol ;)' });
    }
    else
    {
        res.jsonp({ result: 'WTF?!' });
    } 
};