'use strict';

module.exports = function(server, app, base_path, debug) {
    const express = require('express');
    const querystring = require('querystring');

    const exphbs = require('express-handlebars');
    app.engine('html', exphbs.create({ extname: '.html' }).engine);
    app.set('view engine', 'html');

    const database = require('./database.js');
    require('./api.js')(base_path, server, database);

    app.use(require('cookie-parser')('A very important secret'));
    app.use(require('body-parser').urlencoded({ extended: false }));

    app.use(express.static('public'));

    var check_login = (req, res, next) => {
        var session_id = req.cookies['session_id'];
        if(session_id) {
            database.validateSession(session_id, (err, user) => {
                if(err || !user) {
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

    app.get(['/', '/select-term', '/statistics', '/settings'], check_login, (req, res) => {
        res.render('app', { api_path: base_path + '/api' });
    });

    app.use('/login', require('csurf')({ cookie: true }));
    app.use('/login', (err, req, res, next) => {
        if(err.code != 'EBADCSRFTOKEN') return next(err);
        res.status(403).send('Form tampered with.');
    });

    app.get('/login', (req, res) => {
        res.render('login', {
            message: req.query.message,
            redirect: req.query.redirect,
            register: req.query.register == 'true',
            username: req.query.username,
            invitation: req.query.invitation,
            csurf: req.csrfToken()
        });
    });

    app.post('/api/login', (req, res) => {
        database.createSession(req.body.username, req.body.password, req.body.invitation, (err, session_id) => {
            if(err) {
                var message = 'message=' + querystring.escape(err.toString());
                var redirect = req.query.redirect ? '&redirect=' + req.query.redirect : '';
                var username = '&username=' + req.body.username;
                var register = '&register=false';
                var invitation = req.body.invitation ? '&invitation=' + req.body.invitation : '';
                res.redirect(req.baseUrl + '/login?' + message + redirect + username + register + invitation);
            } else {
                res.cookie('session_id', session_id, { expires: new Date(Date.now() + 24 * 60 * 60 * 1000) });
                res.redirect(req.query.redirect || req.baseUrl);
            }
        });
    });

    app.post('/api/logout', (req, res) => {
        var session_id = req.cookies['session_id']
        if(session_id) {
            database.destroySession(session_id, (err) => {
                res.clearCookie('session_id');
                res.redirect(req.baseUrl + '/');
            });
        } else {
            res.redirect(req.baseUrl + '/');
        }
    });

    app.post('/api/register', (req, res) => {
        database.createUser(req.body.username, req.body.password, req.body.invitation, (err) => {
            if(err) {
                var message = 'message=' + querystring.escape(err.toString());
                var redirect = req.query.redirect ? '&redirect=' + req.query.redirect : '';
                var username = '&username=' + req.body.username;
                var register = '&register=true';
                var invitation = req.body.invitation ? '&invitation=' + req.body.invitation : '';
                res.redirect(req.baseUrl + '/login?' + message + redirect + username + register + invitation);
            } else {
                var message = 'message=' + querystring.escape('Register success, please login.');
                var redirect = req.query.redirect ? '&redirect=' + req.query.redirect : '';
                res.redirect(req.baseUrl + '/login?' + message + redirect);
            }
        });
    });
}
