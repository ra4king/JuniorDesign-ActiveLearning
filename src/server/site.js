'use strict';

module.exports = function(server, app, base_url) {
    const express = require('express');
    const querystring = require('querystring');

    const exphbs = require('express-handlebars');
    app.engine('html', exphbs.create({ extname: '.html' }).engine);
    app.set('view engine', 'html');

    const database = require('./database.js');
    require('./api.js')(base_url, server, database);

    app.use(require('cookie-parser')('A very important secret'));
    app.use(require('body-parser').urlencoded({ extended: false }));

    app.use(express.static('public'));

    var check_login = function(req, res, next) {
        var session_id = req.cookies['session_id'];
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
            res.render('professor');
        } else {
            res.render('student');
        }
    });

    app.get('/admin', check_login, function(req, res) {
        var user = req.user;

        if(user.admin) {
            res.render('admin');
        } else {
            res.status(404).send('Not found');
        }
    });

    app.get('/statistics', check_login, function(req, res) {
        var user = req.user;
        
        if(user.admin) {
            res.render('professor');
        } else {
            res.render('student');
        }
    });

    app.get('/settings', check_login, function(req, res) {
        var user = req.user;

        if(user.admin) {
            res.render('professor');
        } else {
            res.status(404).send('Not found');
        }
    });

    app.use('/login', require('csurf')({ cookie: true }));
    app.use('/login', function(err, req, res, next) {
        if(err.code != 'EBADCSRFTOKEN') return next(err);
        res.status(403).send('Form tampered with.');
    });

    app.get('/login', function(req, res) {
        console.log(req.query.register);
        res.render('login', {
            message: req.query.message,
            redirect: req.query.redirect,
            register: (req.query.register=='true'),
            username: req.query.username,
            csurf: req.csrfToken()
        });
    });

    app.post('/api/login', function(req, res) {
        database.create_session(req.body.username, req.body.password, function(err, session_id) {
            if(err) {
                var message = 'message=' + querystring.escape(err.toString());
                var redirect = req.query.redirect ? '&redirect=' + req.query.redirect : '';
                var username = '&username=' + req.body.username;
                var register = '&register=false'
                res.redirect(req.baseUrl + '/login?' + message + redirect + username + register);
            } else {
                res.cookie('session_id', session_id, { expires: new Date(Date.now() + 24 * 60 * 60 * 1000) });
                res.redirect(req.query.redirect || req.baseUrl);
            }
        });
    });

    app.post('/api/logout', function(req, res) {
        var session_id = req.cookies['session_id']
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
                var username = '&username=' + req.body.username;
                var register = '&register=true'
                res.redirect(req.baseUrl + '/login?' + message + redirect + username + register);
            } else {
                var message = 'message=' + querystring.escape('Register success, please login.');
                var redirect = req.query.redirect ? '&redirect=' + req.query.redirect : '';
                res.redirect(req.baseUrl + '/login?' + message + redirect);
            }
        });
    });
}