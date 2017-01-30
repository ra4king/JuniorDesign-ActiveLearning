module.exports = function(base_url, server, database) {
    var ws = require('ws');

    var websocket = new ws.Server({ server: server, path: base_url + '/api', perMessageDeflate: false });

    var admin_username = 'Professor';

    var current_connection_id = 0;

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
        database.get_questions(function(err, questions) {
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

        var username = null;
        var conn_id = -1;

        function verifyAdmin() {
            if(username != admin_username) {
                if(is_open(socket)) {
                    socket.send(JSON.stringify({ error: 'Permission denied.' }));
                }
                return false;
            }

            return true;
        }

        socket.on('message', function(msg) {
            var data;
            try {
                data = JSON.parse(msg);
            } catch(e) {
                console.error('Could not parse: ' + msg);
                return;
            }

            console.log('Received: ' + JSON.stringify(data, null, 4));

            if(username == null && data.username) {
                if(data.username == admin_username || data.username == 'Student') {
                    username = data.username;
                    conn_id = current_connection_id++;
                    connections[conn_id] = { connection: socket, username: username };
                    return;
                }

                database.validate_user(data.username, data.password, function(err) {
                    if(!is_open(socket))
                        return;

                    if(err) {
                        return socket.send(JSON.stringify({ login_success: false, error: err }));
                    }

                    username = data.username;
                    conn_id = current_connection_id++;
                    connections[conn_id] = { connection: socket, username: username };

                    socket.send(JSON.stringify({ login_success: true }));
                });

                return;
            }

            if(username == null && data.register) {
                database.create_user(data.register, data.password, function(err) {
                    if(!is_open(socket))
                        return;

                    if(err) {
                        return socket.send(JSON.stringify({ register_success: false, error: err }));
                    }

                    socket.send(JSON.stringify({ register_success: true }));
                });

                return;
            }

            if(!username) {
                return is_open(socket) && socket.send(JSON.stringify({ error: 'Not logged in.' }));
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
                database.get_questions(function(err, questions) {
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

            if(conn_id != -1) {
                delete connections[conn_id];
            }

            if(username == admin_username) {
                set_live_question_id(null);
            }
        });
    });
}