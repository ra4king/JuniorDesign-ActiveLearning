'use strict';

module.exports = function(base_url, server, database) {
    var ws = require('ws');

    var websocket = new ws.Server({ server: server, path: base_url + '/api', perMessageDeflate: false });

    var connections = {};
    var live_question_id = null;

    function set_live_question_id(id) {
        live_question_id = id;
        if(live_question_id) {
            database.get_question_by_id(live_question_id, function(err, question) {
                broadcast(JSON.stringify({ live_question: question }));
            });
        } else {
            broadcast(JSON.stringify({ live_question: null }));
        }
    }

    function broadcast(msg) {
        for(var conn_id in connections) {
            var conn = connections[conn_id];
            if(is_open(conn.connection)) {
                conn.connection.send(msg);
            }
        }
    }

    function broadcast_questions() {
        database.get_questions(true, function(err, questions) {
            broadcast(JSON.stringify({ questions: questions }));
        });
    }

    function broadcast_quizzes() {
        database.get_quizzes(function(err, quizzes) {
            broadcast(JSON.stringify({ quizzes: quizzes }));
        });
    }

    function is_open(socket) {
        return socket.readyState == 1;
    }

    websocket.on('connection', function(socket) {
        console.log('Accepted connection.');

        var session_id = null;
        var user_data = null;

        socket.on('message', function(msg) {
            var data;
            try {
                data = JSON.parse(msg);
            } catch(e) {
                console.error('Could not parse: ' + msg);
                return;
            }

            console.log('Received: ' + JSON.stringify(data, null, 4));

            if(session_id == null && data.session_id) {
                database.validate_session(data.session_id, function(err, user) {
                    if(!is_open(socket))
                        return;

                    if(err) {
                        return socket.send(JSON.stringify({ request: data, error: err }));
                    }

                    session_id = data.session_id;
                    user_data = user;

                    connections[session_id] = { connection: socket, session_id: session_id, user: user };

                    socket.send(JSON.stringify({ login_success: true }));
                });

                return;
            }

            if(session_id == null) {
                socket.send(JSON.stringify({ request: data, error: 'Not logged in.' }));
                return;
            }

            function verifyAdmin() {
                if(!user_data || !user_data.admin) {
                    socket.send(JSON.stringify({ request: data, error: 'Permission denied.' }));
                    return false;
                }

                return true;
            }

            if(data.create_question) {
                if(!verifyAdmin()) return;

                database.create_question(data.create_question, broadcast_questions);
            }

            if(data.check_question) {
                database.check_question(data.check_question, function(err, is_correct) {
                    if(is_open(socket)) {
                        socket.send(JSON.stringify({answer_question: {responce: is_correct}}));
                    }
                });
            }

            if(data.delete_question) {
                if(!verifyAdmin()) return;

                database.delete_question(data.delete_question, function(err, quiz_modified) {
                    broadcast_questions();
                    if(quiz_modified) {
                        broadcast_quizzes();
                    }
                });
            }

            if(data.get_questions) {
                database.get_questions(user_data.admin, function(err, questions) {
                    if(is_open(socket)) {
                        socket.send(JSON.stringify({ questions: questions }));
                    }
                });
            }

            if(data.create_quiz) {
                if(!verifyAdmin()) return;

                database.create_quiz(data.create_quiz, broadcast_quizzes);
            }

            if(data.update_quiz) {
                if(!verifyAdmin()) return;

                database.update_quiz(data.update_quiz, broadcast_quizzes);
            }

            if(data.delete_quiz) {
                if(!verifyAdmin()) return;

                database.delete_quiz(data.delete_quiz, broadcast_quizzes);
            }

            if(data.get_quizzes) {
                database.get_quizzes(function(err, quizzes) {
                    if(is_open(socket)) {
                        socket.send(JSON.stringify({ quizzes: quizzes }));
                    }
                });
            }

            if(data.get_live_question) {
                set_live_question_id(live_question_id);
            }

            if(data.broadcast_live_question) {
                set_live_question_id(data.broadcast_live_question);
            }

            if(data.end_live_question) {
                set_live_question_id(null);
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
