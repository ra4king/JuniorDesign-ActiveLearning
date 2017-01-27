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

var escape = require('escape-html');

var MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;

var database;
var questions;
var quizzes;

MongoClient.connect('mongodb://localhost:27017', function(err, db) {
    if(err) {
        console.log(err);
        return;
    }

    console.log('Successully connected to mongodb.');
    database = db;
    questions = db.collection('questions');
    quizzes = db.collection('quizzes');
});

function create_question(question, callback) {
    question.name = escape(question.name);
    question.answers.forEach(function(elem, idx) {
        question.answers[idx] = escape(elem);
    });

    questions.insertOne(question, function(err, result) {
        if(err) {
            console.error('Error when inserting: ' + question);
            console.error(err);
        }

        callback(err);
    });
}

function check_question(check_question, callback) {
    var id = check_question.id;
    var answer = check_question.answer;

    questions.findOne({ _id: new ObjectID(id) }, function(err, question) {
        if(err) {
            console.error('Error when checking question: ' + check_question);
            console.error(err);
            return callback(err);
        }

        callback(err, question.correct == answer);
    });
}

function delete_question(question_id, callback) {
    questions.findOneAndDelete({ _id: new ObjectID(question_id) }, function(err, result) {
        if(err) {
            console.error('Error when deleting question: ' + question_id);
            console.error(err);
            return callback(err);
        }

        callback(result.ok ? null : 'An unspecified error occurred.');
    });
}

function get_question_by_id(question_id, callback) {
    questions.findOne({ _id: new ObjectID(question_id) }, function(err, question) {
        if(err) {
            console.error('Error when getting question by id: ' + question_id);
            console.error(err);
            return callback(err);
        }

        callback(null, question);
    });
}

function get_questions(callback) {
    questions.find({}).toArray(function(err, results) {
        if(err) {
            console.error('Error when getting all questions');
            console.error(err);
            return callback(err);
        }

        var cleaned = {};
        results.forEach(function(result) {
            var id = result._id.toHexString();

            cleaned[id] = {
                id: id,
                name: result.name,
                answers: result.answers,
                correct: result.correct,
                image: result.image
            };
        });

        callback(null, cleaned);
    });
}

function create_quiz(quiz, callback) {
}

function update_quiz(quiz, callback) {
}

function delete_quiz(quiz_id, callback) {
}

function get_quizzes(callback) {
}
