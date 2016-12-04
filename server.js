var ws = require('ws');
var fs = require('fs');
var escape = require('escape-html');

var server = new ws.Server({ port: 1337 }, function() {
    console.log('Websockets server up on port 1337...');
});

var config = JSON.parse(fs.readFileSync('config.json'));
var last_id = config.last_id;
var quizzes = config.quizzes;
var questions = config.questions;

function save_config() {
    fs.writeFileSync('config.json', JSON.stringify({ last_id: last_id, quizzes: quizzes, questions: questions }, null, 4));
}

var admin_username = 'Professor';

var current_connection_id = 0;

var connections = {};
var live_question_id = null;

function set_live_question_id(id) {
    live_question_id = id;
    broadcast(JSON.stringify({ live_question: live_question_id == 0 ? null : questions[live_question_id]}));
}

function broadcast(msg, source_id) {
    for(var conn_id in connections) {
        var conn = connections[conn_id];
        conn.connection.send(msg);
    }
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

            var question = data.create_question;
            question.name = escape(question.name);
            question.answers.forEach(function(elem, idx) {
                question.answers[idx] = escape(elem);
            });

            question.id = last_id++;
            questions[question.id] = question;
            save_config();

            broadcast(JSON.stringify({ questions: questions }));
        }

        if(data.delete_question) {
            if(!verifyAdmin()) return;

            var question_id = data.delete_question;
            delete questions[question_id];
            save_config();

            broadcast(JSON.stringify({ questions: questions }));
        }

        if(data.get_questions) {
            socket.send(JSON.stringify({ questions: questions }));
        }

        if(data.create_quiz) {
            if(!verifyAdmin()) return;

            var quiz = data.create_quiz;
            quiz.name = escape(quiz.name);

            quiz.id = last_id++;
            quizzes[quiz.id] = quiz;
            save_config();

            broadcast(JSON.stringify({ quizzes: quizzes }));
        }

        if(data.update_quiz) {
            if(!verifyAdmin()) return;

            var quiz = data.update_quiz;
            quiz.name = escape(quiz.name);
            
            quizzes[quiz.id] = quiz;
            save_config();

            broadcast(JSON.stringify({ quizzes: quizzes }));
        }

        if(data.delete_quiz) {
            if(!verifyAdmin()) return;

            var quiz_id = data.delete_quiz;
            delete quizzes[quiz_id];
            save_config();

            broadcast(JSON.stringify({ quizzes: quizzes }));
        }

        if(data.get_quizzes) {
            socket.send(JSON.stringify({ quizzes: quizzes }));
        }

        if(data.get_live_question) {
            socket.send(JSON.stringify({ live_question: live_question_id == null ? null : questions[live_question_id]}))
        }

        if(data.broadcast_live_question) {
            set_live_question_id(data.broadcast_live_question);
        }

        if(data.end_live_question) {
            set_live_question_id(0);
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
            set_live_question_id(0);
        }
    });
});
