var port = 1337;
var base_url = '/active-learning';

var database = require('./database.js');

var express = require('express');

var main = express();
var server = require('http').createServer(main);

var app = express();
main.use(base_url, app);

require('./api.js')(base_url, server, database);

app.use(require('cookie-parser')('A very important secret'));
app.use(require('body-parser').urlencoded({ extended: false }));

// app.use(require('csurf')({ cookie: true }));

// app.use(function(err, req, res, next) {
//     if(err.code != 'EBADCSRFTOKEN') return next(err);

//     res.status(403).send('Form tampered with.');
// });

app.use(express.static('public'));

var check_login = function(req, res, next) {
    if(req.signedCookies['session_id']) {
        database.validate_session(req.signedCookies['session_id'], function(err, user) {
            if(err || !user) {
                console.log('Not validated: ' + err + ' ' + user);
                res.clearCookie('session_id');
                res.sendFile('html/login.html', { root: __dirname});
            } else {
                req.user = user;
                next();
            }
        });
    } else {
        res.sendFile('html/login.html', { root: __dirname});
    }
};

app.get('/', check_login, function(req, res) {
    var user = req.user;

    if(user.admin) {
        console.log('Validated as admin');
        res.sendFile('html/professor/home.html', { root: __dirname });
    } else {
        console.log('Validated as student');
        res.sendFile('html/student/home.html', { root: __dirname });
    }
});

app.post('/api/login', function(req, res) {
    console.log(req.query);

    database.create_session(req.body.username, req.body.password, function(err, session_id) {
        if(!err) {
            console.log('Setting cookie');

            res.cookie('session_id', session_id, { expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), signed: true });
        }

        res.redirect(app.mountpath + '/');
    });
});

app.post('/api/register', function(req, res) {
    console.log('register:');
    console.dir(req.body);
    res.redirect(app.mountpath + '/');
});

server.listen(port, function() {
    console.log('Site is up at port ' + port + '.');
});
