var ws = require('ws');
var fs = require('fs');

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
        } else if(data.create_question) {
            var question = data.create_question;
            question.id = last_id++;
            questions[question.id] = question;
            save_config();

            socket.send(JSON.stringify({ questions: questions }));
        } else if(data.get_questions) {
            socket.send(JSON.stringify({ questions: questions }));
        } else if(data.create_quiz) {
            var quiz = data.create_quiz;
            quiz.id = last_id++;
            quizzes[quiz.id] = quiz;
            save_config();

            socket.send(JSON.stringify({ quizzes: quizzes }));
        } else if(data.get_quizzes) {
            socket.send(JSON.stringify({ quizzes: quizzes }));
        }
    });

    socket.on('close', function() {
        console.log('Connection closed.');
    });
});
