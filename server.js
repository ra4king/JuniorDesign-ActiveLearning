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

server.on('connection', function(socket) {
    console.log('Accepted connection.');

    var username = null;

    socket.on('message', function(msg) {
        var data = JSON.parse(msg);
        console.log('Received: ' + JSON.stringify(data, null, 4));

        if(username == null && data.username) {
            username = data.username;
        }

        if(data.create_question) {
            var question = data.create_question;
            question.name = escape(question.name);
            question.answers.forEach(function(elem, idx) {
                question.answers[idx] = escape(elem);
            });

            question.id = last_id++;
            questions[question.id] = question;
            save_config();

            socket.send(JSON.stringify({ questions: questions }));
        }

        if(data.delete_question) {
            var question_id = data.delete_question;
            delete questions[question_id];
            save_config();

            socket.send(JSON.stringify({ questions: questions }));
        }

        if(data.get_questions) {
            socket.send(JSON.stringify({ questions: questions }));
        }

        if(data.create_quiz) {
            var quiz = data.create_quiz;
            quiz.name = escape(quiz.name);
            
            quiz.id = last_id++;
            quizzes[quiz.id] = quiz;
            save_config();

            socket.send(JSON.stringify({ quizzes: quizzes }));
        }

        if(data.update_quiz) {
            var quiz = data.update_quiz;
            quizzes[quiz.id] = quiz;
            save_config();

            socket.send(JSON.stringify({ quizzes: quizzes }));
        }

        if(data.delete_quiz) {
            var quiz_id = data.delete_quiz;
            delete quizzes[quiz_id];
            save_config();

            socket.send(JSON.stringify({ quizzes: quizzes }));
        }

        if(data.get_quizzes) {
            socket.send(JSON.stringify({ quizzes: quizzes }));
        }
    });

    socket.on('close', function() {
        console.log('Connection closed.');
    });
});
