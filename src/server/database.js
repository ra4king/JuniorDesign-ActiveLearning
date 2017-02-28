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
    get_stats: get_stats
};

var crypto = require('crypto');

var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;
var ObjectID = mongodb.ObjectID;

var config = require('./config.json');

var database;

var users;
/*
{
    username,
    hash,
    salt,
    iterations,
    admin: bool
}
*/

var sessions;
/*
{
    _id: String session_id,
    username,
    createAt
}
*/

var questions;
/*
{
    _id: ObjectID question_id,
    name,
    answers: [String],
    correct: int index into answers array,
    image: String base64-encoded image
}
*/

var quizzes;
/*
{
    _id: ObjectID quiz_id,
    name,
    questions: [question_id]
}
*/

var submissions;
/*
{
    timestamp,
    username,
    quiz_id,
    quiz_name,
    answers: [
        {
            name,
            answer: int,
            score,
            total
        }
    ]
}
*/

MongoClient.connect('mongodb://roiatalla.com:27017', function(err, db) {
    if(err) {
        console.error(err);
        return;
    }

    console.log('Successully connected to mongodb.');
    database = db;

    db.authenticate(config.user, config.pwd, function(err, result) {
        users = db.collection('users');
        sessions = db.collection('sessions');
        questions = db.collection('questions');
        quizzes = db.collection('quizzes');
        submissions = db.collection('submissions');

        users.createIndex({ username: 1 }, { background: true, unique: true });
        sessions.createIndex({ username: 1, createdAt: 1 }, { background: true, expireAfterSeconds: 24 * 60 * 60 }); // 1 day
        submissions.createIndex({ username: 1, timestamp: 1 }, { background: true, unique: true });
    });
});

function create_user(username, passwords, callback) {
    if(!database) {
        return callback('Not connected to database.');
    }

    var password = passwords[0];
    var password2 = passwords[1];

    // TODO: Make passwords stronger....
    if(!username || typeof username !== 'string' ||
        !password || typeof password !== 'string' ||
        !password2 || typeof password2 !== 'string') {
        return callback('Username and password cannot be empty.');
    }

    if(password != password2) {
        return callback('Passwords do not match.');
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
            console.log('password:');
            console.log(password);
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
    if(!database) {
        return callback('Not connected to database.');
    }

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
    if(!database) {
        return callback('Not connected to database.');
    }

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
    if(!database) {
        return callback('Not connected to database.');
    }

    sessions.findOneAndDelete({ _id: session_id }, function(err, result) {
        if(err) {
            console.error('Error when destroying session');
            console.error(err);
        }

        callback(err);
    });
}

function cleanup_user(user, noadmin) {
    return {
        username: user.username,
        permissions: user.permissions,
        admin: (noadmin ? undefined : user.admin)
    };
}

function get_user(username, callback) {
    if(!database) {
        return callback('Not connected to database.');
    }

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
    if(!database) {
        return callback('Not connected to database.');
    }

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
            students.push(cleanup_user(user, true))
        });

        callback(null, students);
    });
}

function validate_question(question) {
    if(!question ||
        typeof question.name !== 'string' ||
        !Array.isArray(question.answers) ||
        (typeof question.correct !== 'string' && typeof question.correct !== 'number') ||
        (question.image && typeof question.image !== 'string') ||
        question.answers.length < 2 ||
        (Number(question.correct) !== NaN &&
        (question.correct % 1 !== 0 ||
        question.correct < 0 ||
        question.correct >= question.answers.length))) {
        return null;
    }

    return {
        name: question.name,
        answers: question.answers.map((ans) => String(ans)),
        correct: String(question.correct),
        image: question.image
    };
}

function create_question(question, callback) {
    if(!database) {
        return callback('Not connected to database.');
    }

    question = validate_question(question);
    if(!question) {
        return callback('Invalid question object.');
    }

    questions.insertOne(question, function(err, result) {
        if(err) {
            console.error('Error when inserting: ' + question);
            console.error(err);
        }

        callback(err);
    });
}

function delete_question(question_id, callback) {
    if(!database) {
        return callback('Not connected to database.');
    }

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

function cleanup_question(question, include_correct) {
    return {
        id: question._id.toHexString(),
        name: question.name,
        answers: question.answers,
        correct: include_correct ? question.correct : undefined,
        image: question.image || undefined
    };
}

function get_question_by_id(question_id, include_correct, callback) {
    if(!database) {
        return callback('Not connected to database.');
    }

    questions.findOne({ _id: new ObjectID(question_id) }, function(err, question) {
        if(err) {
            console.error('Error when getting question by id: ' + question_id);
            console.error(err);
            return callback(err);
        }

        callback(null, cleanup_question(question, include_correct));
    });
}

function get_questions(include_correct, callback) {
    if(!database) {
        return callback('Not connected to database.');
    }

    questions.find().toArray(function(err, results) {
        if(err) {
            console.error('Error when getting all questions');
            console.error(err);
            return callback(err);
        }

        var cleaned_questions = {};
        results.forEach(function(result) {
            var cleaned = cleanup_question(result, include_correct);
            cleaned_questions[cleaned.id] = cleaned;
        });

        callback(null, cleaned_questions);
    });
}

function validate_quiz(quiz) {
    if(!quiz ||
        typeof quiz.name !== 'string' ||
        !Array.isArray(quiz.questions) ||
        quiz.questions.length === 0) {
        return null;
    }

    return {
        name: quiz.name,
        questions: quiz.questions.map((q) => String(q))
    };
}

function create_quiz(quiz, callback) {
    if(!database) {
        return callback('Not connected to database.');
    }

    quiz = validate_quiz(quiz);
    if(!quiz) {
        return callback('Invalid quiz object.');
    }

    var ids = quiz.questions.map((id) => new ObjectID(id));

    questions.find({ _id: { $in: ids }}).toArray(function(err, results) {
        var verifiedIds = [];
        quiz.questions.forEach(function(id) {
            if(results.findIndex(function(result) { return result._id.toHexString() === id }) != -1) {
                verifiedIds.push(id);
            }
        });

        quiz.questions = verifiedIds;

        quizzes.insertOne(quiz, function(err, result) {
            if(err) {
                console.error('Error when creating quiz: ' + quiz);
                console.error(err);
            }

            callback(err);
        });
    });
}

function update_quiz(quiz, callback) {
    if(!database) {
        return callback('Not connected to database.');
    }

    var quiz_id = quiz.id;
    quiz = validate_quiz(quiz);
    if(!quiz) {
        return callback('Invalid quiz object.');
    }

    var ids = quiz.questions.map((id) => new ObjectID(id));

    questions.find({ _id: { $in: ids }}).toArray(function(err, results) {
        var verifiedIds = [];
        quiz.questions.forEach(function(id) {
            if(results.findIndex((result) => result._id.toHexString() === id) != -1) {
                verifiedIds.push(id);
            }
        });

        quiz.questions = verifiedIds;

        quizzes.updateOne({ _id: new ObjectID(quiz_id) }, { $set: quiz }, function(err, result) {
            if(err) {
                console.error('Error when updating quiz: ' + quiz);
                console.error(err);
            }

            callback(err);
        });
    });
}

function delete_quiz(quiz_id, callback) {
    if(!database) {
        return callback('Not connected to database.');
    }

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
    if(!database) {
        return callback('Not connected to database.');
    }

    quizzes.findOne({ _id: new ObjectID(quiz_id) }, function(err, quiz) {
        if(err) {
            console.error('Error when getting quiz by id: ' + quiz_id);
            console.error(err);
            return callback(err);
        }

        if(quiz) {
            callback(null, {
                id: quiz._id.toHexString(),
                name: quiz.name,
                questions: quiz.questions,
            });
        } else {
            callback(null, null);
        }
    });
}

function get_quizzes(callback) {
    if(!database) {
        return callback('Not connected to database.');
    }

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
    if(!database) {
        return callback('Not connected to database.');
    }

    if(!submission ||
        typeof submission.quiz_id !== 'string' ||
        !submission.answers) {
        return callback('Invalid user or submission object.');
    }

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

        doc.quiz_name = quiz.name;

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
                        name: question.name,
                        answer: doc.answers[id],
                        score: doc.answers[id] == question.correct ? 1 : 0,
                        total: 1
                    }
                }
            });

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

function get_stats(username, callback) {
    if(!database) {
        return callback('Not connected to database.');
    }
    
    var find = {};

    if(typeof username == 'function') {
        callback = username;
    } else {
        find = {
            username: username
        };
    }

    submissions.find(find).sort({ username: 1, timestamp: 1 }).toArray(function(err, results) {
        if(err) {
            console.error('Error when getting statistics');
            console.error(err);
            return callback(err);
        }

        var stats = {};

        results.forEach(function(result) {
            var username = result.username;

            if(!stats[username]) {
                stats[username] = {};
            }

            stats[username][result.quiz_id] = {
                name: result.quiz_name,
                questions: result.answers
            };
        });

        callback(null, stats);
    });
}
