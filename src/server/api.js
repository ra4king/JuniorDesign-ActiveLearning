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

    database.events.on('term', (term) => {
        let name = term._id + '-terms';

        if(subscriptions[name]) {
            subscriptions[name].forEach((connection) => {
                connection.socket.sendEvent('term', [term]);
            });
        }
    });
    database.events.on('user', (user) => {
        if(allConnections[user.username]) {
            allConnections[user.username].user = user;

            allConnections[user.username].socket.sendEvent('user', user);
        }
    });
    database.events.on('question', (question) => {
        let name = question.course_id + '-questions';

        if(subscriptions[name]) {
            subscriptions[name].forEach((connection) => {
                connection.socket.sendEvent('questions', [question]);
            });
        }
    });
    database.events.on('quiz', (quiz) => {
        let name = quiz.term_id + '-quizzes';

        if(subscriptions[name]) {
            if(quiz.removed) {
                let toSend = { _id: quiz._id, removed: true };

                subscriptions[name].forEach((connection) => {
                    connection.socket.sendEvent('quizzes', [toSend]);
                });
            } else {
                database.getQuizById(false, String(quiz._id), (err, quizWithQuestions) => {
                    if(err) {
                        console.error('Error when getting quiz with questions');
                        console.error(err);
                    }

                    subscriptions[name].forEach((connection) => {
                        var [permissions, admin] = getPermissions(connection);
                        if(admin) {
                            connection.socket.sendEvent('quizzes', [quiz]);
                        } else if(quizWithQuestions) {
                            connection.socket.sendEvent('quizzes', [quizWithQuestions]);
                        }
                    });
                });
            }
        }
    });
    database.events.on('submission', (submission) => {
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
                    unsubscribe(connection.selectedTerm.term_id + '-terms', connection);
                }

                connection.selectedTerm = {
                    term_id: term_id,
                    course_id: String(term.course._id),
                    school_id: String(term.school._id)
                };

                if(termAdmin) {
                    subscribe(term.course._id + '-questions', connection);
                }

                subscribe(term_id + '-quizzes', connection);
                subscribe(term_id + '-submissions', connection);
                subscribe(term_id + '-terms', connection);

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

    commands.on('createResource', (connection, resource, reply) => {
        var [permissions, admin] = getPermissions(connection);
        if(connection.user.admin || (permissions && (permissions.isCreator || (permissions.isTA && permissions.canCreateQuestions)))) {
            database.createResource(resource, reply);
        } else {
            reply('Permission denied.');
        }
    });

    commands.on('deleteResource', (connection, resource_id, reply) => {
        var [permissions, admin] = getPermissions(connection);
        if(connection.user.admin || (permissions && (permissions.isCreator || (permissions.isTA && permissions.canCreateQuestions)))) {
            database.deleteResource(resource_id, reply);
        } else {
            reply('Permission denied.');
        }
    });

    commands.on('getResource', (connection, resource_id, reply) => {
        database.getResource(resource_id, reply);
    });

    commands.on('createQuestion', (connection, question, reply) => {
        var [permissions, admin] = getPermissions(connection);
        if(connection.user.admin || (permissions && (permissions.isCreator || (permissions.isTA && permissions.canCreateQuestions)))) {
            question.course_id = permissions.course_id;
            database.createQuestion(question, reply);
        } else {
            reply('Permission denied.');
        }
    });

    commands.on('updateQuestion', (connection, question, reply) => {
        var [permissions, admin] = getPermissions(connection);
        if(connection.user.admin || (permissions && (permissions.isCreator || (permissions.isTA && permissions.canEditQuestions)))) {
            database.updateQuestion(question, permissions.course_id, reply);
        } else {
            reply('Permission denied.');
        }
    });

    commands.on('deleteQuestion', (connection, question_id, reply) => {
        var [permissions, admin] = getPermissions(connection);
        if(connection.user.admin || (permissions && (permissions.isCreator || (permissions.isTA && permissions.canEditQuestions)))) {
            database.deleteQuestion(question_id, permissions.course_id, reply);
        } else {
            reply('Permission denied.');
        }
    });

    commands.on('createQuiz', (connection, quiz, reply) => {
        var [permissions, admin] = getPermissions(connection);
        if(connection.user.admin || (permissions && (permissions.isCreator || (permissions.isTA && permissions.canCreateQuizzes)))) {
            quiz.term_id = permissions.term_id;
            database.createQuiz(quiz, reply);
        } else {
            reply('Permission denied.');
        }
    });

    commands.on('updateQuiz', (connection, quiz, reply) => {
        var [permissions, admin] = getPermissions(connection);
        if(connection.user.admin || (permissions && (permissions.isCreator || (permissions.isTA && permissions.canEditQuizzes)))) {
            database.updateQuiz(quiz, permissions.term_id, reply);
        } else {
            reply('Permission denied.');
        }
    });

    commands.on('updateLiveQuiz', (connection, live_quiz, reply) => {
        var [permissions, admin] = getPermissions(connection);
        if(connection.user.admin || (permissions && (permissions.isCreator || (permissions.isTA && permissions.canEditQuizzes)))) {
            database.updateLiveQuiz(live_quiz.quiz_id, permissions.term_id, live_quiz.question_idx, reply);
        } else {
            reply('Permission denied.');
        }
    });

    commands.on('deleteQuiz', (connection, quiz_id, reply) => {
        var [permissions, admin] = getPermissions(connection);
        if(connection.user.admin || (permissions && (permissions.isCreator || (permissions.isTA && permissions.canEditQuizzes)))) {
            database.deleteQuiz(quiz_id, permissions.term_id, reply);
        } else {
            reply('Permission denied.');
        }
    });

    commands.on('submitQuiz', (connection, submission, reply) => {
        var [permissions, admin] = getPermissions(connection);
        if(admin) {
            reply('Cannot submit a quiz as a term admin.');
        } else {
            submission.term_id = permissions.term_id;
            database.submitQuiz(connection.user.username, submission, reply);
        }
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
        });

        socket.on('error', function(error) {
            console.log('Error in connection: ' + error);
        });

        socket.on('close', function() {
            console.log('Connection closed.');

            if(connection.user) {
                delete allConnections[connection.user.username];
            }

            if(connection.selectedTerm) {
                unsubscribe(connection.selectedTerm.course_id + '-questions', connection);
                unsubscribe(connection.selectedTerm.term_id + '-quizzes', connection);
                unsubscribe(connection.selectedTerm.term_id + '-submissions', connection);
            }
        });
    });
}
