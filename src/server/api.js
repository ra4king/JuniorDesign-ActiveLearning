'use strict';

module.exports = function(base_url, server, database) {
    var ws = require('ws');
    var EventEmitter = require('events');

    var websocket = new ws.Server({ server: server, path: base_url + '/api', perMessageDeflate: false });

    var subscriptions = {};

    function subscribe(event, connection) {
        if(subscriptions[event]) {
            subscriptions[event].push(connection);
        } else {
            subscriptions[event] = [connection];
        }
    }

    function unsubscribe(event, connection) {
        if(subscriptions[event]) {
            let idx = subscriptions[event].findIndex((conn) => conn == connection);
            if(idx != -1) {
                subscriptions[event].splice(idx, 1);
            }
        }
    }

    var allConnections = {};

    database.events.on('users', (user) => {
        if(allConnections[user.username]) {
            console.log('SAVED USER:');
            console.log(user);

            allConnections[user.username].user = user;

            allConnections[user.username].socket.sendEvent('user', user);
        }
    });

    database.events.on('questions', (question) => {
        console.log('SAVED QUESTION:');
        console.log(question);

        let name = question.course_id + '-questions';

        if(subscriptions[name]) {
            subscriptions[name].forEach((connection) => {
                connection.socket.sendEvent('questions', [question]);
            });
        }
    });
    database.events.on('quizzes', (quiz) => {
        console.log('SAVE QUIZ:');
        console.log(quiz);

        let name = quiz.term_id + '-quizzes';

        if(subscriptions[name]) {
            // TODO: Students need questions in quizzes, not IDs

            subscriptions[name].forEach((connection) => {
                connection.socket.sendEvent('quizzes', [quiz]);
            });
        }
    });
    database.events.on('submissions', (submission) => {
        console.log('SUBMISSION SAVED:');
        console.log(submission);

        let name = submission.term_id + '-submissions';

        if(subscriptions[name]) {
            // process submission object here

            subscriptions[name].forEach((connection) => {
                connection.socket.sendEvent('submissions', [submission]);
            });
        }
    });

    function getPermissions(connection) {
        if(!connection.user.lastSelectedTerm) {
            return [null, false];
        }

        var idx = connection.user.permissions.findIndex((permission) =>
                        String(permission.term_id) === String(connection.user.lastSelectedTerm.term_id));
        if(idx === -1) {
            return [connection.user.lastSelectedTerm, connection.user.admin];
        }

        var permissions = connection.user.permissions[idx];
        return [permissions, permissions.isCreator || permissions.isTA];
    }

    function sendQuestions(connection) {
        var [permissions, admin] = getPermissions(connection);
        if(admin) {
            database.getQuestionsByCourse(permissions.course_id, (err, questions) => {
                if(!err) {
                    connection.socket.sendEvent('questions', questions);
                }
            });
        }
    }

    function sendQuizzes(connection) {
        var [permissions, admin] = getPermissions(connection);
        database.getQuizzesByTerm(admin, permissions.term_id, (err, quizzes) => {
            if(!err) {
                connection.socket.sendEvent('quizzes', quizzes);
            }
        });
    }

    function sendSubmissions(connection) {
        var [permissions, admin] = getPermissions(connection);

        var send = (err, submissions) => {
            if(!err) {
                connection.socket.sendEvent('submissions', submissions);
            }
        };

        if(admin) {
            database.getSubmissionsByTerm(permissions.term_id, send);
        } else {
            database.getSubmissionsByUser(connection.user.username, permissions.term_id, send);
        }
    }


    var commands = new EventEmitter();
    commands.on('getSchools', (connection, arg, reply) => {
        database.getSchools(reply);
    });

    commands.on('getCourses', (connection, school_id, reply) => {
        database.getCourses(school_id, reply);
    });

    commands.on('getTerms', (connection, course_id, reply) => {
        database.getTerms(course_id, reply);
    });

    commands.on('selectTerm', (connection, term_id, reply) => {
        var permissions = connection.user.permissions.find((permissions) => permissions.term_id == term_id);
        if(connection.user.admin || permissions) {
            var termAdmin = connection.user.admin || permissions.isCreator || permissions.isTA;

            database.selectTerm(connection.user.username, term_id, (err, term) => {
                if(err) {
                    return reply(err);
                }

                if(connection.selectedTerm) {
                    unsubscribe(connection.selectedTerm.course_id + '-questions', connection);
                    unsubscribe(connection.selectedTerm.term_id + '-quizzes', connection);
                    unsubscribe(connection.selectedTerm.term_id + '-submissions', connection);
                }

                connection.selectedTerm = {
                    term_id: term_id,
                    course_id: term.course_id
                };

                if(termAdmin) {
                    subscribe(term.course_id + '-questions', connection);
                }

                subscribe(term_id + '-quizzes', connection);
                subscribe(term_id + '-submissions', connection);

                reply(null, term);

                sendQuestions(connection);
                sendQuizzes(connection);
                sendSubmissions(connection);
            });
        } else {
            return reply('Permission denied.');
        }
    });

    commands.on('getAllUsers', (connection, arg, reply) => {
        var [permissions, admin] = getPermissions(connection);
        if(connection.user.admin || (permissions && (permissions.isCreator || (permissions.isTA && permissions.canManageRoster)))) {
            database.getAllUsers(permissions.term_id, reply);
        } else {
            reply('Permission denied.');
        }
    });

    commands.on('addUser', (connection, username, reply) => {
        var [permissions, admin] = getPermissions(connection);
        if(connection.user.admin || (permissions && (permissions.isCreator || (permissions.isTA && permissions.canManageRoster)))) {
            database.addUser(permissions.term_id, username, {}, reply);
        } else {
            reply('Permission denied.');
        }
    });

    commands.on('setPermissions', (connection, info, reply) => {
        var [permissions, admin] = getPermissions(connection);
        if(connection.user.admin || (permissions && (permissions.isCreator || (permissions.isTA && permissions.canManageTAs)))) {
            info.permissions.term_id = permissions.term_id;
            database.setPermissions(info.username, info.permissions, reply);
        } else {
            reply('Permission denied.');
        }
    });

    commands.on('createQuestion', (connection, question, reply) => {
        var [permissions, admin] = getPermissions(connection);
        if(connection.user.admin || (permissions && (permissions.isCreator || (permissions.isTA && permissions.canCreateQuestions)))) {
            if(permissions.course_id != question.course_id) {
                reply('Incorrect course_id');
            } else {
                database.createQuestion(question, reply);
            }
        } else {
            reply('Permission denied.');
        }
    });

    commands.on('updateQuestion', (connection, question, reply) => {
        var [permissions, admin] = getPermissions(connection);
        if(connection.user.admin || (permissions && (permissions.isCreator || (permissions.isTA && permissions.canEditQuestions)))) {
            if(permissions.course_id != question.course_id) {
                reply('Incorrect course_id');
            } else {
                database.updateQuestion(question, reply);
            }
        } else {
            reply('Permission denied.');
        }
    });

    commands.on('createQuiz', (connection, quiz, reply) => {
        var [permissions, admin] = getPermissions(connection);
        if(connection.user.admin || (permissions && (permissions.isCreator || (permissions.isTA && permissions.canCreateQuizzes)))) {
            if(permissions.term_id != quiz.term_id) {
                reply('Incorrect term_id');
            } else {
                database.createQuiz(quiz, reply);
            }
        } else {
            reply('Permission denied.');
        }
    });

    commands.on('updateQuiz', (connection, quiz, reply) => {
        var [permissions, admin] = getPermissions(connection);
        if(connection.user.admin || (permissions && (permissions.isCreator || (permissions.isTA && permissions.canEditQuizzes)))) {
            if(permissions.term_id != quiz.term_id) {
                reply('Incorrect term_id');
            } else {
                database.updateQuiz(quiz, reply);
            }
        } else {
            reply('Permission denied.');
        }
    });

    commands.on('submitQuiz', (connection, submission, reply) => {

    });


    websocket.on('connection', function(socket) {
        console.log('Accepted connection');

        function isOpen() {
            return socket.readyState == 1;
        }

        (function ping() {
            if(isOpen()) {
                socket.ping();
                setTimeout(ping, 1000);
            }
        })();

        socket.sendEvent = function(event, data) {
            if(isOpen()) {
                socket.send(JSON.stringify({event: event, data: data}));
            }
        };

        var connection = {
            session_id: null,
            user: null,
            socket: socket
        };

        socket.on('message', function(msg) {
            try {
                msg = JSON.parse(msg);
            } catch(e) {
                console.error('Could not parse: ' + JSON.stringify(msg));
                return;
            }

            var reply = function(err, data) {
                if(isOpen()) {
                    socket.send(JSON.stringify({id: msg.id, err: err || undefined, data: data}));
                }
            };

            console.log('Received: ' + JSON.stringify(msg, null, 4));

            if(connection.session_id == null && msg.command === 'login') {
                return database.validateSession(msg.data, function(err, user) {
                    if(!isOpen())
                        return;

                    if(err || !user) {
                        return reply(err || 'Not validated');
                    }

                    connection.session_id = msg.data;
                    connection.user = user;

                    allConnections[user.username] = connection;

                    reply(null, user);
                });
            }

            if(connection.session_id == null) {
                reply('Not logged in.');
                return;
            }

            if(!commands.emit(msg.command, connection, msg.data, reply)) {
                reply('Unknown command.');
            }

            // switch(msg.command) {
            //     case 'getUser':
            //         database.getUser(user.username, reply);
            //         break;
            //     case 'getUsers':
            //         database.getAllUsers(msg.data, reply);
            //         break;
            //     case 'setPermissions':
            //         database.setPermissions(msg.data, reply);
            //         break;
            //     case 'createSchool':
            //         database.createSchool(msg.data, reply);
            //         break;
            //     case 'updateSchool':
            //         database.updateSchool(msg.data, reply);
            //         break;
            //     case 'createCourse':
            //         database.createCourse(msg.data, reply);
            //         break;
            //     case 'updateCourse':
            //         database.updateCourse(msg.data, reply);
            //         break;
            //     case 'createTerm':
            //         database.createTerm(msg.data, reply);
            //         break;
            //     case 'updateTerm':
            //         database.updateTerm(msg.data, reply);
            //         break;
            //     case 'addUser':
            //         database.addUser(msg.data, reply);
            //         break;
            //     case 'removeUser':
            //         database.removeUser(msg.data, reply);
            //         break;
            //     case 'createResource':
            //         database.createResource(msg.data, reply);
            //         break;
            //     case 'deleteResource':
            //         database.deleteResource(msg.data, reply);
            //         break;
            //     case 'getResource':
            //         database.getResource(msg.data, reply);
            //         break;
            //     case 'createQuestion':
            //         database.createQuestion(msg.data, (err) => reply(err) && !err && broadcast_questions());
            //         break;
            //     case 'updateQuestion':
            //         database.updateQuestion(msg.data, (err) => reply(err) && !err && broadcast_questions());
            //         break;
            //     case 'deleteQuestion':
            //         database.deleteQuestion(msg.data, (err) => reply(err) && !err && broadcast_questions() && broadcast_quizzes());
            //         break;
            //     case 'getQuestionById':
            //         database.getQuestionById(user.admin, msg.data, reply);
            //         break;
            //     case 'getQuestionsByTerm':
            //         database.getQuestionsByTerm(user.admin, msg.data, reply);
            //         break;
            //     case 'getQuestionsByQuiz':
            //         database.getQuestionsByQuiz(user.admin, msg.data, reply);
            //         break;
            //     case 'createQuiz':
            //         database.createQuiz(msg.data, (err) => reply(err) && !err && broadcast_quizzes());
            //         break;
            //     case 'updateQuiz':
            //         database.updateQuiz(msg.data, (err) => reply(err) && !err && broadcast_quizzes());
            //         break;
            //     case 'deleteQuiz':
            //         database.deleteQuiz(msg.data, (err) => reply(err) && !err && broadcast_quizzes());
            //         break;
            //     case 'getQuizById':
            //         database.getQuizById(user.admin, msg.data, reply);
            //         break;
            //     case 'getQuizzesByTerm':
            //         database.getQuizzesByTerm(user.admin, msg.data, reply);
            //         break;
            //     case 'submitQuiz':
            //         database.submitQuiz(user, msg.data, reply);
            //         break;
            //     case 'getSubmissionsByUser':
            //         database.getSubmissionsByUser(user, msg.data, reply);
            //         break;
            //     case 'getSubmissionsByTerm':
            //         database.getSubmissionsByTerm(user, msg.data, reply);
            //         break;

            //     case 'getLiveQuestion':
            //         if(live_question_id) {
            //             database.get_question_by_id(live_question_id, false, reply);
            //         } else {
            //             reply(null, null);
            //         }

            //         break;

            //     case 'broadcastLiveQuestion':
            //         reply();
            //         set_live_question_id(msg.data);
            //         break;

            //     case 'endLiveQuestion':
            //         reply();
            //         set_live_question_id(null);
            //         break;
            // }
        });

        socket.on('error', function(error) {
            console.log('Error in connection: ' + error);
        });

        socket.on('close', function() {
            console.log('Connection closed.');

            if(connection.user) {
                delete allConnections[connection.user.username];
            }
        });
    });
}
