var ws = require('ws');
var database = require('./database-mongodb.js');

var server = new ws.Server({ port: 1337 }, function() {
    console.log('Websockets server up on port 1337...');
});

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
        conn.connection.send(msg);
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

server.on('connection', function(socket) {
    console.log('Accepted connection.');

    var username = null;
    var conn_id = -1;

    function verifyAdmin() {
        if(username != admin_username) {
            socket.send(JSON.stringify({ error: 'Permission denied.' }));
            return false;
        }

        return true;
    }

    socket.on('message', function(msg) {
        var data = JSON.parse(msg);
        console.log('Received: ' + JSON.stringify(data, null, 4));

        if(username == null && data.username) {
            username = data.username;

            conn_id = current_connection_id++;
            connections[conn_id] = { connection: socket, username: username };
        }

        if(data.create_question) {
            if(!verifyAdmin()) return;

            database.create_question(data.create_question, broadcast_questions);
        }

        if(data.check_question) {
            database.check_question(data.check_question, function(err, is_correct) {
                socket.send(JSON.stringify({answer_question: {responce: is_correct}}));
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
                socket.send(JSON.stringify({ questions: questions }));
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
                socket.send(JSON.stringify({ quizzes: quizzes }));
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
        if(data.check_question) {
            var student_answer = data.check_question.answer;
            var answer = questions[data.check_question.id].correct;
            socket.send(JSON.stringify({answer_question: {responce: student_answer == null ? false : student_answer == answer}}));
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
