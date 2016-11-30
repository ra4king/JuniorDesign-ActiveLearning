var ws = require('ws');
var fs = require('fs');

var server = new ws.Server({ port: 1337 }, function() {
    console.log('Websockets server up on port 1337...');
});

var config = JSON.parse(fs.readFileSync('config.json'));
var quizzes = config.quizzes;
var questions = config.questions;

function save_config() {
    fs.writeFileSync('config.json', JSON.stringify({ quizzes: quizzes, questions: questions }, null, 4));
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
            question.id = questions.length;
            questions.push(question);
            socket.send(JSON.stringify({ question_id:  question.id }));
            save_config();
        } else if(data.get_questions) {
            socket.send(JSON.stringify({ questions: questions }));
        } else if(data.create_quiz) {
            var quiz = data.create_quiz;
            quiz.id = quizzes.length;
            quizzes.push(quiz);
            save_config();
        } else if(data.get_quizzes) {
            socket.send(JSON.stringify({ quizzes: quizzes }));
        }
    });

    socket.on('close', function() {
        console.log('Connection closed.');
    });
});
