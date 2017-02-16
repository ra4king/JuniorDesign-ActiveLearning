'use strict';

module.exports = {
    create_user: create_user,

    get_user: get_user,
    get_all_users: get_all_users,

    create_session: create_session,
    validate_session: validate_session,
    destroy_session: destroy_session,

    create_question: create_question,
    //update_question: update_question, // TODO
    delete_question: delete_question,
    get_question_by_id: get_question_by_id,
    get_questions: get_questions,

    create_quiz: create_quiz,
    update_quiz: update_quiz,
    delete_quiz: delete_quiz,
    get_quiz_by_id: get_quiz_by_id,
    get_quizzes: get_quizzes,

    submit_quiz: submit_quiz,
};

var escape = require('escape-html');
var crypto = require('crypto');

var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;
var ObjectID = mongodb.ObjectID;

var database;

var users;
var sessions;
var questions;
var quizzes;
var submissions;

MongoClient.connect('mongodb://localhost:27017', function(err, db) {
    if(err) {
        console.error(err);
        return;
    }

    console.log('Successully connected to mongodb.');
    database = db;
    users = db.collection('users');
    sessions = db.collection('sessions');
    questions = db.collection('questions');
    quizzes = db.collection('quizzes');
    submissions = db.collection('submissions');

    users.createIndex({ username: 1 }, { unique: true });
    sessions.createIndex({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 }); // 30 days
    submissions.createIndex({ username: 1, timestamp: 1 }, { unique: true });
});

function create_user(username, password, callback) {
    if(!username || !password) {
        return callback('Username and password cannot be empty.');
    }

    users.findOne({ username: username }, function(err, result) {
        if(err) {
            console.error('Error when checking if username exists before creating it: ' + username);
            console.error(err);
            return callback(err);
        }

        if(result) {
            return callback('This username is already taken.');
        }

        crypto.randomBytes(128, function(err, buf) {
            if(err) {
                console.error('Error when generating salt when creating user: ' + username);
                console.error(err);
                return callback(err);
            }

            var salt = buf.toString('base64');
            var iterations = 100000;
            crypto.pbkdf2(password, salt, iterations, 512, 'sha512', function(err, buf) {
                var hash = buf.toString('base64');

                var user = {
                    username: username,
                    hash: hash,
                    salt: salt,
                    iterations: iterations,

                    admin: username == 'admin'
                };

                users.insertOne(user, function(err, result) {
                    if(err) {
                        console.error('Error when inserting new user: ' + username);
                        console.error(err);
                    }

                    callback(err);
                });
            });
        });
    });
}

function create_session(username, password, callback) {
    if(!username || !password) {
        return callback('Username and password cannot be empty.');
    }
    
    users.findOne({ username: username }, function(err, result) {
        if(err) {
            console.error('Error when creating session: ' + username);
            console.error(err);
            return callback(err);
        }

        if(result) {
            crypto.pbkdf2(password, result.salt, result.iterations, 512, 'sha512', function(err, buf) {
                var hash = buf.toString('base64');

                if(hash == result.hash) {
                    crypto.randomBytes(128, function(err, buf) {
                        if(err) {
                            console.error('Error when generating session id: ' + username);
                            console.error(err);
                            return callback(err);
                        }

                        var id = buf.toString('base64');

                        sessions.insert({ _id: id, username: username, createdAt: new Date() });

                        callback(null, id);
                    });
                } else {
                    callback('Username not found or password incorrect.');
                }
            });
        } else {
            callback('Username not found or password incorrect.');
        }
    });
}

function validate_session(session_id, callback) {
    sessions.findOne({ _id: session_id }, function(err, result) {
        if(err) {
            console.error('Error when validating session');
            console.error(err);
            return callback(err);
        }

        if(result) {
            get_user(result.username, callback);
        } else {
            callback();
        }
    });
}

function destroy_session(session_id, callback) {
    sessions.findOneAndDelete({ _id: session_id }, function(err, result) {
        if(err) {
            console.error('Error when destroying session');
            console.error(err);
        }

        callback(err);
    });
}

function cleanup_user(user) {
    return {
        username: user.username,
        admin: user.admin,
    };
}

function get_user(username, callback) {
    users.findOne({ username: username }, function(err, user) {
        if(err) {
            console.error('Error when getting user: ' + username);
            console.error(err);
            return callback(err);
        }

        if(user) {
            callback(null, cleanup_user(user));
        } else {
            callback();
        }
    });
}

function get_all_users(callback) {
    users.find({ admin: false }).toArray(function(err, results) {
        if(err) {
            console.error('Error when getting all users');
            console.error(err);
            return callback(err);
        }

        results.sort(function(a, b) {
            if(a.username < b.username) {
                return -1;
            }
            if(a.username > b.username) {
                return 1;
            }
            return 0;
        });

        var students = []
        results.forEach(function(user) {
            students.push(cleanup_user(user))
        });

        callback(null, students);
    });
}

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

        quizzes.updateMany({ questions: { $elemMatch: { $eq: question_id }}}, { $pull: { questions: question_id }}, function(err, result) {
            if(err) {
                console.error('Error when deleting question from quizzes: ' + question_id);
                console.error(err);
                return callback(err);
            }

            callback(null, result.modifiedCount > 0);
        });
    });
}

function get_question_by_id(question_id, callback) {
    questions.findOne({ _id: new ObjectID(question_id) }, function(err, question) {
        if(err) {
            console.error('Error when getting question by id: ' + question_id);
            console.error(err);
            return callback(err);
        }

        callback(null, {
            id: question._id.toHexString(),
            name: question.name,
            answers: question.answers,
            correct: question.correct,
            image: question.image
        });
    });
}

function get_questions(include_correct, callback) {
    questions.find().toArray(function(err, results) {
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
                correct: include_correct ? result.correct : undefined,
                image: result.image
            };
        });

        callback(null, cleaned);
    });
}

function create_quiz(quiz, callback) {
    var to_insert = {
        name: escape(quiz.name),
        questions: quiz.questions
    };

    quizzes.insertOne(to_insert, function(err, result) {
        if(err) {
            console.error('Error when creating quiz: ' + quiz);
            console.error(err);
        }

        callback(err);
    });
}

function update_quiz(quiz, callback) {
    var to_update = {
        name: escape(quiz.name),
        questions: quiz.questions
    };

    quizzes.updateOne({ _id: new ObjectID(quiz.id) }, { $set: to_update }, function(err, result) {
        if(err) {
            console.error('Error when updating quiz: ' + quiz);
            console.error(err);
        }

        callback(err);
    });
}

function delete_quiz(quiz_id, callback) {
    quizzes.findOneAndDelete({ _id: new ObjectID(quiz_id) }, function(err, result) {
        if(err) {
            console.error('Error when deleting quiz: ' + quiz_id);
            console.error(err);
            return callback(err);
        }

        callback(result.ok ? null : 'An unspecified error occurred.');
    });
}

function get_quiz_by_id(quiz_id, callback) {
    quizzes.findOne({ _id: new ObjectID(quiz_id) }, function(err, quiz) {
        if(err) {
            console.error('Error when getting quiz by id: ' + quiz_id);
            console.error(err);
            return callback(err);
        }

        callback(null, {
            id: quiz._id.toHexString(),
            name: quiz.name,
            questions: quiz.questions,
        });
    });
}

function get_quizzes(callback) {
    quizzes.find().toArray(function(err, results) {
        if(err) {
            console.error('Error when getting all quizzes');
            console.error(err);
            return callback(err);
        }

        var cleaned = {};
        results.forEach(function(result) {
            var id = result._id.toHexString();

            cleaned[id] = {
                id: id,
                name: result.name,
                questions: result.questions
            };
        });

        callback(null, cleaned);
    });
}

function submit_quiz(user, submission, callback) {
    var doc = {
        timestamp: new Date(),
        username: user.username,
        quiz_id: submission.quiz_id,
        answers: submission.answers
    };

    get_quiz_by_id(submission.quiz_id, function(err, quiz) {
        if(err) {
            return callback(err);
        }

        var ids = quiz.questions.map(function(id) {
            return new ObjectID(id);
        });

        questions.find({ _id: { $in: ids }}).toArray(function(err, results) {
            if(err) {
                console.error('Error when getting all questions in quiz ' + submission.quiz_id);
                console.error(err);
                return callback(err);
            }

            results.forEach(function(question) {
                var id = question._id.toHexString();
                if(doc.answers[id] !== undefined) {
                    doc.answers[id] = {
                        answer: doc.answers[id],
                        correct: doc.answers[id] == question.correct
                    }
                }
            });

            console.log('Inserting:');
            console.log(JSON.stringify(doc, null, 4));
            
            submissions.insertOne(doc, function(err, result) {
                if(err) {
                    console.error('Error when creating submission: ' + doc);
                    console.error(err);
                }

                callback(err);
            });
        });
    });
}
