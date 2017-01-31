var port = 1337;
var base_url = '/active-learning';

var database = require('./database.js');

var express = require('express');
var exphbs = require('express-handlebars');
var querystring = require('querystring');

var main = express();
var server = require('http').createServer(main);

var app = express();
main.use(base_url, app);

app.engine('html', exphbs.create({ extname: '.html' }).engine);
app.set('view engine', 'html');

require('./api.js')(base_url, server, database);

app.use(require('cookie-parser')('A very important secret'));
app.use(require('body-parser').urlencoded({ extended: false }));

app.use('/login', require('csurf')({ cookie: true }));
app.use('/login', function(err, req, res, next) {
    if(err.code != 'EBADCSRFTOKEN') return next(err);
    res.status(403).send('Form tampered with.');
});

app.use(express.static('public'));

var check_login = function(req, res, next) {
    var session_id = req.signedCookies['session_id']
    if(session_id) {
        database.validate_session(session_id, function(err, user) {
            if(err || !user) {
                console.log('Not validated: ' + err + ' ' + user);
                res.clearCookie('session_id');
                res.redirect(req.baseUrl + '/login?redirect=' + req.originalUrl);
            } else {
                req.user = user;
                next();
            }
        });
    } else {
        res.redirect(req.baseUrl + '/login?redirect=' + req.originalUrl);
    }
};

app.get('/', check_login, function(req, res) {
    var user = req.user;

    if(user.admin) {
        console.log('Validated as admin');
        res.render('professor/home');
    } else {
        console.log('Validated as student');
        res.render('student/home');
    }
});

app.get('/login', function(req, res) {
    res.render('login', { message: req.query.message, redirect: req.query.redirect, csurf: req.csrfToken() });
});

app.post('/api/login', function(req, res) {
    database.create_session(req.body.username, req.body.password, function(err, session_id) {
        if(err) {
            var message = 'message=' + querystring.escape(err.toString());
            var redirect = req.query.redirect ? '&redirect=' + req.query.redirect : '';
            res.redirect(req.baseUrl + '/login?' + message + redirect);
        } else {
            res.cookie('session_id', session_id, { expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), signed: true });
            res.redirect(req.query.redirect || req.baseUrl);
        }
    });
});

app.post('/api/logout', function(req, res) {
    var session_id = req.signedCookies['session_id']
    if(session_id) {
        database.destroy_session(session_id, function(err) {
            res.clearCookie('session_id');
            res.redirect(req.baseUrl + '/');
        });
    } else {
        res.redirect(req.baseUrl + '/');
    }
});

app.post('/api/register', function(req, res) {
    database.create_user(req.body.username, req.body.password, function(err) {
        if(err) {
            var message = 'message=' + querystring.escape(err.toString());
            var redirect = req.query.redirect ? '&redirect=' + req.query.redirect : '';
            res.redirect(req.baseUrl + '/login?' + message + redirect);
        } else {
            var message = 'message=' + querystring.escape('Register success, please login.');
            var redirect = req.query.redirect ? '&redirect=' + req.query.redirect : '';
            res.redirect(req.baseUrl + '/login?' + message + redirect);
        }
    });
});

server.listen(port, function() {
    console.log('Site is up at port ' + port + '.');
});
