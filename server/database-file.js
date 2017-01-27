module.exports = {
    create_question: create_question,
    check_question: check_question,
    delete_question: delete_question,
    get_question_by_id: get_question_by_id,
    get_questions: get_questions,

    create_quiz: create_quiz,
    update_quiz: update_quiz,
    delete_quiz: delete_quiz,
    get_quizzes: get_quizzes,
};

var fs = require('fs');
var escape = require('escape-html');

var config = JSON.parse(fs.readFileSync('config.json'));
var last_id = config.last_id;
var quizzes = config.quizzes;
var questions = config.questions;

function save_config() {
    fs.writeFileSync('config.json', JSON.stringify({ last_id: last_id, quizzes: quizzes, questions: questions }, null, 4));
}

function create_question(question, callback) {
    question.name = escape(question.name);
    question.answers.forEach(function(elem, idx) {
        question.answers[idx] = escape(elem);
    });

    question.id = last_id++;
    questions[question.id] = question;
    save_config();

    callback(null);
}

function check_question(check_question, callback) {
    var student_answer = check_question.answer;
    var answer = questions[check_question.id].correct;

    callback(null, student_answer != null && student_answer == answer);
}

function delete_question(question_id, callback) {
    delete questions[question_id];

    var quiz_modified = false;
    for(var quiz_id in quizzes) {
        var quiz = quizzes[quiz_id];
        var id = quiz.questions.indexOf(question_id);
        if(id != -1) {
            quiz_modified = true;
            quiz.questions.splice(id, 1);
        }
    }

    save_config();

    callback(null, quiz_modified);
}

function get_question_by_id(question_id, callback) {
    callback(null, questions[question_id]);
}

function get_questions(callback) {
    callback(null, questions);
}


function create_quiz(quiz, callback) {
    quiz.name = escape(quiz.name);

    quiz.id = last_id++;
    quizzes[quiz.id] = quiz;

    save_config();

    callback(null);
}

function update_quiz(quiz, callback) {
    quiz.name = escape(quiz.name);
    quizzes[quiz.id] = quiz;
    save_config();

    callback(null);
}

function delete_quiz(quiz_id, callback) {
    delete quizzes[quiz_id];
    save_config();

    callback(null);
}

function get_quizzes(callback) {
    callback(null, quizzes);
}
