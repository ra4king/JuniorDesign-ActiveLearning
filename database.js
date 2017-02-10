module.exports = {
    create_user: create_user,
    create_session: create_session,
    validate_session: validate_session,
    destroy_session: destroy_session,

    get_user: get_user,

    create_question: create_question,
    check_question: check_question,
    delete_question: delete_question,
    get_question_by_id: get_question_by_id,
    get_questions: get_questions,
    get_students: get_students,

    create_quiz: create_quiz,
    update_quiz: update_quiz,
    delete_quiz: delete_quiz,
    get_quizzes: get_quizzes,
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

    users.createIndex({ username: 1 }, { unique: true });
    sessions.createIndex({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 }); // 30 days
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

function get_user(username, callback) {
    users.findOne({ username: username }, function(err, user) {
        if(err) {
            console.error('Error when getting user: ' + username);
            console.error(err);
            return callback(err);
        }

        if(user) {
            callback(null, {
                username: user.username,
                admin: user.admin,
            });
        } else {
            callback();
        }
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

function get_questions(callback) {
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
                correct: result.correct, // TODO depending on role, send back
                image: result.image
            };
        });

        callback(null, cleaned);
    });
}

function get_students(callback) {
    users.find().toArray(function(err, results) {
        if(err) {
            console.error('Error when getting all users');
            console.error(err);
            return callback(err);
        }

        results.sort(function(a, b) {
            return a.username - b.username;
        });

        var students = []
        results.forEach(function(result) {
            if(result.admin == false) {
                students.push(result);
            }
        });
        callback(null, students);

    });
}

function create_quiz(quiz, callback) {
    quiz.name = escape(quiz.name);

    quizzes.insertOne(quiz, function(err, result) {
        if(err) {
            console.error('Error when creating quiz: ' + quiz);
            console.error(err);
        }

        callback(err);
    });
}

function update_quiz(quiz, callback) {
    quiz.name = escape(quiz.name);

    quizzes.updateOne({ _id: new ObjectID(quiz.id) }, { $set: quiz }, function(err, result) {
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
