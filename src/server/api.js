'use strict';

module.exports = function(base_url, server, database) {
    var ws = require('ws');

    var websocket = new ws.Server({ server: server, path: base_url + '/api', perMessageDeflate: false });

    var connections = {};
    var live_question_id = null;

    function set_live_question_id(id) {
        live_question_id = id;
        if(live_question_id) {
            database.get_question_by_id(live_question_id, false, function(err, question) {
                if(!err && question) {
                    broadcast('live_question', question);
                }
            });
        } else {
            broadcast('live_question', null);
        }
    }

    function broadcast(command, data) {
        for(var conn_id in connections) {
            var conn = connections[conn_id];
            if(is_open(conn.socket)) {
                conn.send(command, null, data);
            }
        }
    }

    function broadcast_questions() {
        database.get_questions(true, function(err, questions) {
            broadcast('questions', questions);
        });
    }

    function broadcast_quizzes() {
        database.get_quizzes(function(err, quizzes) {
            broadcast('quizzes', quizzes);
        });
    }

    function is_open(socket) {
        return socket.readyState == 1;
    }

    websocket.on('connection', function(socket) {
        console.log('Accepted connection');

        var session_id = null;
        var user_data = null;

        (function ping() {
            if(is_open(socket)) {
                socket.ping();
                setTimeout(ping, 1000);
            }
        })();

        var send = function(command, err, data) {
            if(is_open(socket)) {
                var to_send = JSON.stringify({id: command, err: err || undefined, data: data}, null, 4);
                socket.send(to_send);
            }
        };

        socket.on('message', function(msg) {
            var data;
            try {
                data = JSON.parse(msg);
            } catch(e) {
                console.error('Could not parse: ' + msg);
                return;
            }

            var reply = function(err, args) {
                send(data.id, err, args);
            };

            console.log('Received: ' + JSON.stringify(data, null, 4));

            if(session_id == null && data.command === 'login') {
                return database.validate_session(data.data, function(err, user) {
                    if(!is_open(socket))
                        return;

                    if(err || !user) {
                        return reply(err || 'Not validated');
                    }

                    session_id = data.data;
                    user_data = user;

                    connections[session_id] = { send: send, socket: socket, session_id: session_id, user: user };

                    reply(null, user);
                });
            }

            if(session_id == null) {
                reply('Not logged in.');
                return;
            }

            function verifyAdmin() {
                if(!user_data || !user_data.admin) {
                    reply('Permission denied.');
                    return false;
                }

                return true;
            }

            switch(data.command) {
                case 'get_users':
                    if(!verifyAdmin()) return;
                    database.get_all_users(reply);
                    break;

                case 'get_stats':
                    if(user_data.admin) {
                        database.get_stats(reply);
                    } else {
                        database.get_stats(user_data.username, reply);
                    }
                    break;

                case 'create_resource':
                    if(!verifyAdmin()) return;
                    database.create_resource(data.data, reply);
                    break;

                case 'get_resource':
                    database.get_resource(data.data, reply);
                    break;

                case 'create_question':
                    if(!verifyAdmin()) return;

                    database.create_question(data.data, function(err) {
                        reply(err);

                        if(!err) {
                            broadcast_questions();
                        }
                    });
                    break;

                case 'update_question':
                    if(!verifyAdmin()) return;

                    database.update_question(data.data, function(err) {
                        reply(err);

                        if(!err) {
                            broadcast_questions();
                        }
                    });
                    break;

                case 'delete_question':
                    if(!verifyAdmin()) return;

                    database.delete_question(data.data, function(err, quiz_modified) {
                        reply(err);

                        broadcast_questions();
                        if(quiz_modified) {
                            broadcast_quizzes();
                        }
                    });
                    break;

                case 'get_questions':
                    database.get_questions(user_data.admin, function(err, questions) {
                        if(is_open(socket)) {
                            reply(null, questions);
                        } else {
                            reply(err);
                        }
                    });
                    break;

                case 'create_quiz':
                    if(!verifyAdmin()) return;

                    database.create_quiz(data.data, function(err) {
                        reply(err);

                        if(!err) {
                            broadcast_quizzes()
                        }
                    });
                    break;

                case 'update_quiz':
                    if(!verifyAdmin()) return;

                    database.update_quiz(data.data, function(err) {
                        reply(err);

                        if(!err) {
                            broadcast_quizzes();
                        }
                    });
                    break;

                case 'delete_quiz':
                    if(!verifyAdmin()) return;

                    database.delete_quiz(data.data, function(err) {
                        reply(err);

                        if(!err) {
                            broadcast_quizzes();
                        }
                    });
                    break;

                case 'get_quizzes':
                    database.get_quizzes(function(err, quizzes) {
                        reply(null, quizzes);
                    });
                    break;

                case 'submit_quiz':
                    database.submit_quiz(user_data, data.data, function(err) {
                        reply(err);
                    });
                    break;

                case 'get_live_question':
                    if(live_question_id) {
                        database.get_question_by_id(live_question_id, false, reply);
                    } else {
                        reply(null, null);
                    }

                    break;

                case 'broadcast_live_question':
                    if(!verifyAdmin()) return;

                    reply();
                    set_live_question_id(data.data);
                    break;

                case 'end_live_question':
                    if(!verifyAdmin()) return;

                    reply();
                    set_live_question_id(null);
                    break;
            }
        });

        socket.on('error', function(error) {
            console.log('Error in connection: ' + error);
        });

        socket.on('close', function() {
            console.log('Connection closed.');

            if(session_id != null) {
                delete connections[session_id];
            }

            if(user_data && user_data.admin) {
                set_live_question_id(null);
            }
        });
    });
}
