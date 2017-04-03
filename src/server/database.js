'use strict';

var EventEmitter = require('events');
var events = new EventEmitter();

module.exports = {
    events: events,

    createSession: createSession,
    validateSession: validateSession,
    destroySession: destroySession,

    createUser: createUser,
    getUser: getUser,
    getAllUsers: getAllUsers,

    createSchool: createSchool,
    updateSchool: updateSchool,
    getSchools: getSchools,

    createCourse: createCourse,
    updateCourse: updateCourse,
    getCourses: getCourses,

    createTerm: createTerm,
    updateTerm: updateTerm,
    getTerms: getTerms,
    addUser: addUser,
    removeUser: removeUser,
    setPermissions: setPermissions,

    selectTerm: selectTerm,

    createResource: createResource,
    deleteResource: deleteResource,
    getResource: getResource,

    createQuestion: createQuestion,
    updateQuestion: updateQuestion,
    deleteQuestion: deleteQuestion,
    getQuestionsByCourse: getQuestionsByCourse,
    //getQuestionById: getQuestionById,
    ///getQuestionsByQuiz: getQuestionsByQuiz,

    createQuiz: createQuiz,
    updateQuiz: updateQuiz,
    updateLiveQuiz: updateLiveQuiz,
    deleteQuiz: deleteQuiz,
    getQuizById: getQuizById,
    getQuizzesByTerm: getQuizzesByTerm,

    submitQuiz: submitQuiz,

    getSubmissionsByUser: getSubmissionsByUser,
    getSubmissionsByTerm: getSubmissionsByTerm
};

const crypto = require('crypto');

const mongodb = require('mongodb');
const ObjectID = mongodb.ObjectID;

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const config = require('./config.json');
mongoose.connect('mongodb://roiatalla.com:27017/admin', { user: config.user, pass: config.pwd }, (err) => {
    if(err) {
        console.error('Error connecting to MongoDB.');
        console.error(err);
        return;
    }

    console.log('Successully connected to mongodb.');
});


const schoolsSchema = new Schema({
    name: { type: String, required: true }
});
schoolsSchema.post('save', (school) => events.emit('school', school.toJSON()));
const School = mongoose.model('School', schoolsSchema);

const coursesSchema = new Schema({
    name: { type: String, required: true },
    school_id: { type: Schema.Types.ObjectId, required: true }
});
coursesSchema.post('save', (course) => events.emit('course', course.toJSON()));
const Course = mongoose.model('Course', coursesSchema);

const termsSchema = new Schema({
    name: { type: String, required: true },
    course_id: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    school_id: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    users: { type: [{ type: String, ref: 'User' }], default: [] }
});
termsSchema.post('save', (term) => events.emit('term', term.toJSON()));
const Term = mongoose.model('Term', termsSchema);

const usersSchema = new Schema({
    _id: { type: String, required: true, unique: true },
    auth: {
        hash: { type: String, required: true },
        salt: { type: String, required: true },
        iterations: { type: Number, required: true },
    },
    admin: Boolean,
    permissions: {
        type: [
            {
                term_id: { type: Schema.Types.ObjectId, required: true },
                course_id: { type: Schema.Types.ObjectId, required: true },
                school_id: { type: Schema.Types.ObjectId, required: true },
                isCreator: { type: Boolean, default: false },
                isTA: { type: Boolean, default: false },
                canCreateQuestions: { type: Boolean, default: false },
                canEditQuestions: { type: Boolean, default: false },
                canCreateQuizzes: { type: Boolean, default: false },
                canEditQuizzes: { type: Boolean, default: false },
                canPublishQuizzes: { type: Boolean, default: false },
                canManageRoster: { type: Boolean, default: false },
                canManageTAs: { type: Boolean, default: false }
            }
        ],
        default: []
    },
    lastSelectedTerm: {
        type: {
            term_id: { type: Schema.Types.ObjectId, ref: 'Term', required: true },
            course_id: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
            school_id: { type: Schema.Types.ObjectId, ref: 'School', required: true }
        },
        default: null
    }
});
usersSchema.post('save', (user) => events.emit('user', cleanupUser(user.toJSON())));
const User = mongoose.model('User', usersSchema);

const sessionsSchema = new Schema({
    _id: { type: String, required: true, unique: true },
    user: { type: String, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now }
});
sessionsSchema.index({ user: 1, createdAt: 1 }, { background: true, expireAfterSeconds: 24 * 60 * 60 });
const Session = mongoose.model('Session', sessionsSchema);

const resourcesSchema = new Schema({
    data: { type: String, required: true },
});
const Resource = mongoose.model('Resource', resourcesSchema);

const questionsSchema = new Schema({
    course_id: { type: Schema.Types.ObjectId, required: true, index: true },
    title: { type: String, trim: true, required: true },
    tags: [{ type: String, lowercase: true, trim: true, required: true }],
    answers: { type: [{ type: String, trim: true, required: true }], required: true, validate: [(a) => a.length >= 2, 'Minimum 2 answers needed'] },
    correct: {                                                // index into answers array,
        type: Number,
        required: true,
        validate: function(n) { return n % 1 === 0 && n >= 0 && n < this.answers.length; }
    },
    image_id: { type: Schema.Types.ObjectId, default: null } // resource_id of an image
});
questionsSchema.post('save', (question) => events.emit('question', question.toJSON()));
questionsSchema.post('remove', (question) => events.emit('question', { _id: question.id, course_id: question.course_id, removed: true }));
const Question = mongoose.model('Question', questionsSchema);

const quizzesSchema = new Schema({
    term_id: { type: Schema.Types.ObjectId, required: true, index: true },
    name: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    is_published: { type: Boolean, required: true },
    is_live: { type: Boolean, default: false },
    questions: {
        type: [{ type: Schema.Types.ObjectId, ref: 'Question' }],
        default: []
    },
    settings: {
        type: {
            live_question: { type: Number, default: -1 },
            open_date: { type: Date, required: true },
            close_date: { type: Date, required: true, validate: function(close_date) { return this.settings.open_date < close_date } },
            max_submission: { type: Number, default: 0 },
            allow_question_review: { type: Boolean, default: false },
            allow_answer_review: { type: Boolean, default: false },
        },
        required: true
    }
});
quizzesSchema.post('save', (quiz) => events.emit('quiz', quiz.toJSON()));
quizzesSchema.post('remove', (quiz) => events.emit('quiz', { _id: quiz.id, term_id: quiz.term_id, removed: true }));
const Quiz = mongoose.model('Quiz', quizzesSchema, 'quizzes');

const submissionsSchema = new Schema({
    timestamp: { type: Date, default: Date.now },
    username: { type: String, required: true },
    term_id: { type: Schema.Types.ObjectId, ref: 'Term', required: true },
    quiz_id: { type: Schema.Types.ObjectId, ref: 'Quiz', required: true },
    quiz_name: { type: String, required: true },
    answers: [
        {
            question_id: { type: Schema.Types.ObjectId, required: true },
            title: { type: String, required: true },
            answer: { type: Number, default: -1 }, // index into answers array
            score: { type: Number, required: true },
            total: { type: Number, required: true }
        }
    ]
});
submissionsSchema.post('save', (submission) => events.emit('submission', submission.toJSON()));
submissionsSchema.index({ term_id: 1, username: 1 }, { background: true });
submissionsSchema.index({ quiz_id: 1, username: 1 }, { background: true });
const Submission = mongoose.model('Submission', submissionsSchema);


function createUser(username, passwords, callback) {
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

    User.findById(username, '-auth', (err, result) => {
        if(err) {
            console.error('Error when checking if username exists before creating it: ' + username);
            console.error(err);
            return callback(err);
        }

        if(result) {
            return callback('This username is already taken.');
        }

        crypto.randomBytes(128, (err, buf) => {
            if(err) {
                console.error('Error when generating salt when creating user: ' + username);
                console.error(err);
                return callback(err);
            }

            var salt = buf.toString('base64');
            var iterations = 100000;
            crypto.pbkdf2(password, salt, iterations, 512, 'sha512', (err, buf) => {
                if(err) {
                    console.error('Error when generating hash when creating user: ' + username);
                    console.error(err);
                    return callback(err);
                }

                var hash = buf.toString('base64');

                new User({
                    _id: username,
                    admin: username === 'admin',
                    auth: {
                        hash: hash,
                        salt: salt,
                        iterations: iterations,
                    }
                }).save((err, result) => {
                    if(err) {
                        console.error('Error when inserting new user: ' + username);
                        console.error(err);
                    }

                    callback(err, result);
                });
            });
        });
    });
}

function createSession(username, password, callback) {
    if(!username || !password) {
        return callback('Username and password cannot be empty.');
    }

    User.findById(username, (err, result) => {
        if(err) {
            console.error('Error when creating session: ' + username);
            console.error(err);
            return callback(err);
        }

        if(result) {
            crypto.pbkdf2(password, result.auth.salt, result.auth.iterations, 512, 'sha512', (err, buf) => {
                var hash = buf.toString('base64');

                if(hash == result.auth.hash) {
                    crypto.randomBytes(128, (err, buf) => {
                        if(err) {
                            console.error('Error when generating session id: ' + username);
                            console.error(err);
                            return callback(err);
                        }

                        var id = buf.toString('base64');

                        new Session({
                            _id: id,
                            user: username
                        }).save((err) => {
                            if(err) {
                                console.error('Error when saving session: ' + username);
                                console.error(err);
                                callback(err);
                            } else {
                                callback(null, id);
                            }
                        });
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

function cleanupUser(user) {
    delete user.auth;
    user.username = user._id;
    return user;
}

function validateSession(session_id, callback) {
    Session.findById(session_id)
        .select('user')
        .populate('user', '-auth')
        .lean()
        .exec((err, result) => {
            if(err) {
                console.error('Error when validating session');
                console.error(err);
                return callback(err);
            }

            if(result && result.user) {
                callback(null, cleanupUser(result.user));
            } else {
                callback('Session not found.');
            }
        });
}

function destroySession(session_id, callback) {
    Session.findByIdAndRemove(session_id, (err, result) => {
        if(err) {
            console.error('Error when destroying session');
            console.error(err);
        }

        callback(err);
    });
}

function getUser(username, callback) {
    User.findById(username)
        .select('-auth')
        .lean()
        .exec((err, user) => {
            if(err) {
                console.error('Error when getting user: ' + username);
                console.error(err);
                return callback(err);
            }

            if(!user) {
                return callback('User not found: ' + username);
            }

            callback(null, cleanupUser(user));
        });
}

function getAllUsers(term_id, callback) {
    Term.findById(new ObjectID(term_id), 'users', (err, term) => {
        if(err) {
            console.error('Error when getting term: ' + term_id);
            console.error(err);
            return callback(err);
        }

        if(!term) {
            return callback('Term not found: ' + term_id);
        }

        User.find({ _id: { $in: term.users }})
            .select('-auth')
            .sort({ _id: 1 })
            .lean()
            .exec((err, results) => {
                if(err) {
                    console.error('Error when getting all users');
                    console.error(err);
                    return callback(err);
                }

                var users = [];
                results.forEach((user) => {
                    var idx = user.permissions.findIndex((perms) => String(perms.term_id) == term_id);
                    if(idx == -1) {
                        console.error('Inconsistency found with user ' + user._id + ', missing permissions for term ' + term_id);
                        return;
                    }

                    if(user.permissions[idx].isCreator) {
                        return;
                    }

                    user.permissions = user.permissions[idx];
                    users.push(cleanupUser(user));
                });

                callback(err, users);
            });
    });
}

function createSchool(school, callback) {
    new School(school).save((err, school) => {
        if(err) {
            console.error('Error when creating school: ' + school);
            console.error(err);
            return callback(err);
        }

        callback(null, school.id);
    });
}

function updateSchool(new_school, callback) {
    var school_id = new_school._id;
    delete new_school._id;

    School.findById(new ObjectID(school_id), (err, school) => {
        if(err) {
            console.error('Error when getting school: ' + school_id);
            console.error(err);
            return callback(err);
        }

        if(!school) {
            return callback('Did not find school: ' + school_id);
        }

        school.set(new_school);
        school.save((err) => {
            if(err) {
                console.error('Error when saving updated school: ' + school);
                console.error(err);
            }

            callback(err);
        });
    });
}

function getSchools(callback) {
    School.find((err, schools) => {
        if(err) {
            console.error('Error when getting schools');
            console.error(err);
        }

        callback(err, schools);
    });
}

function createCourse(course, callback) {
    new Course(course).save((err, course) => {
        if(err) {
            console.error('Error when creating course: ' + course);
            console.error(err);
            return callback(err);
        }

        callback(null, course.id);
    });
}

function updateCourse(new_course, callback) {
    var course_id = new_course._id;
    delete new_course._id;

    Course.findById(new ObjectID(course_id), (err, course) => {
        if(err) {
            console.error('Error when getting course: ' + course_id);
            console.error(err);
            return callback(err);
        }

        if(!course) {
            return callback('Did not find course: ' + course_id);
        }

        course.set(new_course);
        course.save((err) => {
            if(err) {
                console.error('Error when saving updated course: ' + course);
                console.error(err);
            }

            callback(err);
        });
    });
}

function getCourses(school_id, callback) {
    Course.find({ school_id: new ObjectID(school_id) }, (err, courses) => {
        if(err) {
            console.error('Error when getting courses for school: ' + school_id);
            console.error(err);
        }

        callback(err, courses);
    });
}

function createTerm(user, term, callback) {
    new Term(term).save((err, term) => {
        if(err) {
            console.error('Error when creating term: ' + term);
            console.error(err);
            return callback(err);
        }

        addUser(term.id, user.username, { isCreator: true }, (err) => {
            if(err) {
                callback(err);
            } else {
                callback(null, term.id);
            }
        });
    });
}

function updateTerm(new_term, callback) {
    if('course_id' in new_term || 'school_id' in new_term) {
        return callback('Cannot set course_id or school_id of term.');
    }

    var term_id = new_term._id;
    delete new_term._id;

    Term.findById(new ObjectID(term_id), (err, term) => {
        if(err) {
            console.error('Error when getting term: ' + term_id);
            console.error(err);
            return callback(err);
        }

        if(!term) {
            return callback('Did not find term: ' + term_id);
        }

        term.set(new_term);
        term.save((err) => {
            if(err) {
                console.error('Error when saving updated term: ' + term);
                console.error(err);
            }

            callback(err);
        });
    });
}

function getTerms(course_id, callback) {
    Term.find({ course_id: new ObjectID(course_id) }, (err, terms) => {
        if(err) {
            console.error('Error when getting terms for course: ' + course_id);
            console.error(err);
        }

        callback(err, terms);
    });
}

function addUser(term_id, username, permissions, callback) {
    Term.findById(new ObjectID(term_id), (err, term) => {
        if(err) {
            console.error('Error when getting term: ' + term_id);
            console.error(err);
            return callback(err);
        }

        if(!term) {
            return callback('Did not find term: ' + term_id);
        }

        if(term.users.indexOf(username) != -1) {
            return callback('User already in the term.');
        }

        permissions.term_id = term.id;
        permissions.course_id = term.course_id;
        permissions.school_id = term.school_id;

        User.findById(username, '-auth', (err, user) => {
            if(err) {
                console.error('Error when getting user: ' + username);
                console.error(err);
                return callback(err);
            }

            if(!user) {
                return callback('Did not find user ' + username);
            }

            var idx = user.permissions.findIndex((perm) => perm.term_id == term_id);
            if(idx != -1) {
                console.error('User "' + username + '" already has permissions for term ' + term_id);
                delete permissions.course_id;
                delete permissions.school_id;
                return setPermissions(username, permissions, callback);
            }

            term.users.push(username);
            term.save((err) => {
                if(err) {
                    console.error('Error when adding user: ' + term_id + ', ' + username);
                    console.error(err);
                    callback(err);
                } else {
                    user.permissions.push(permissions);
                    user.save((err) => {
                        if(err) {
                            console.error('Error when saving user permissions for ' + username);
                            console.error(err);
                        }

                        callback(err);
                    });
                }
            });
        });
    });
}

function removeUser(term_id, username, callback) {
    Term.findById(new ObjectID(term_id), (err, term) => {
        if(err) {
            console.error('Error when getting term: ' + term_id);
            console.error(err);
            return callback(err);
        }

        if(!term) {
            return callback('Did not find term: ' + term_id);
        }

        if(term.users.indexOf(username) == -1) {
            return callback('User not in the course.');
        }

        User.findById(username, '-auth', (err, user) => {
            if(err) {
                console.error('Error when finding user: ' + username);
                console.error(err);
                return callback(err);
            }

            if(!user) {
                term.users.pull(username);
                term.save((err) => {
                    if(err) {
                        console.error('Error when removing user: ' + term_id + ', ' + username);
                        console.error(err);
                    }
                    
                    callback(err || 'User not found.');
                });
                return;
            }

            var idx = user.permissions.findIndex((perm) => String(perm.term_id) == term_id);
            if(idx == -1) {
                return callback();
            }

            user.permissions.splice(idx, 1);

            user.save((err) => {
                if(err) {
                    console.error('Error when saving user permissions.');
                    console.error(err);
                    return callback(err);
                }

                term.users.pull(username);
                term.save((err) => {
                    if(err) {
                        console.error('Error when removing user: ' + term_id + ', ' + username);
                        console.error(err);
                    }
                    
                    callback(err);
                });
            });
        });
    });
}

function setPermissions(username, permissions, callback) {
    if('course_id' in permissions || 'school_id' in permissions) {
        return callback('Cannot set course_id or school_id in permissions.');
    }

    User.findById(username, '-auth', (err, user) => {
        if(err) {
            console.error('Error when finding user: ' + username);
            console.error(err);
            return callback(err);
        }

        if(!user) {
            return callback('Did not find user: ' + username);
        }

        var idx = user.permissions.findIndex((perm) => String(perm.term_id) == permissions.term_id);
        if(idx == -1) {
            return callback('User not in the term.');
        }

        Object.assign(user.permissions[idx], permissions);

        user.save((err) => {
            if(err) {
                console.error('Error when saving user permissions for user ' + username);
                console.error(err);
            }

            callback(err);
        });
    });
}

function selectTerm(username, term_id, callback) {
    Term.findById(new ObjectID(term_id))
        .populate('school_id course_id')
        .select('-users')
        .lean()
        .exec((err, term) => {
            if(err) {
                console.error('Error when selecting term: ' + term_id);
                console.error(err);
                return callback(err);
            }

            if(!term) {
                return callback('Did not find term: ' + term_id);
            }

            User.findById(username, '-auth', (err, user) => {
                if(err) {
                    console.error('Error when getting user: ' + username);
                    console.error(err);
                    return callback(err);
                }

                user.lastSelectedTerm = {
                    term_id: term_id,
                    course_id: term.course_id._id,
                    school_id: term.school_id._id
                };

                user.save((err) => {
                    return callback(null, {
                        _id: term_id,
                        name: term.name,
                        course: term.course_id,
                        school: term.school_id,
                    });
                });
            });
        });
}

function createResource(resource, callback) {
    new Resource({ data: resource }).save((err, result) => {
        if(err) {
            console.error('Error when creating resource: ' + resource);
            console.error(err);
            return callback(err);
        }

        callback(null, result.id);
    });
}

function deleteResource(resource_id, callback) {
    Resource.findByIdAndRemove(new ObjectID(resource_id), (err) => {
        if(err) {
            console.error('Error when deleting resource: ' + resource_id);
            console.error(err);
        }

        callback(err);
    });
}

function getResource(resource_id, callback) {
    Resource.findById(new ObjectID(resource_id)).lean().exec((err, resource) => {
        if(err) {
            console.error('Error when getting resource: ' + resource_id);
            console.error(err);
            return callback(err);
        }

        if(resource) {
            callback(null, resource.data);
        } else {
            callback('Resource not found with id: ' + resource_id);
        }
    });
}

function createQuestion(question, callback) {
    new Question(question).save((err) => {
        if(err) {
            console.error('Error when inserting question: ' + JSON.stringify(question, null, 4));
            console.error(err);
        }

        callback(err);
    });
}

function updateQuestion(question, required_course_id, callback) {
    if('term_id' in question) {
        return callback('Cannot set term_id in question.');
    }

    var question_id = question._id;
    delete question._id;

    Question.findById(new ObjectID(question_id), (err, result) => {
        if(err) {
            console.error('Error when update question: ' + JSON.stringify(question, null, 4));
            console.error(err);
            return callback(err);
        }

        if(!result || String(result.course_id) != required_course_id) {
            return callback('Question not found with id: ' + question_id);
        }

        result.set(question);
        result.save((err) => {
            if(err) {
                console.error('Error when saving question: ' + JSON.stringify(question, null, 4));
                console.error(err);
            }

            callback(err);
        });
    });
}

function deleteQuestion(question_id, required_course_id, callback) {
    question_id = new ObjectID(question_id);

    Question.findById(question_id, (err, question) => {
        if(err) {
            console.error('Error when deleting question: ' + question_id);
            console.error(err);
            return callback(err);
        }

        if(!question || String(question.course_id) != required_course_id) {
            return callback('Question not found with id: ' + question_id);
        }

        question.remove((err) => {
            if(err) {
                console.error('Error deleting question: ' + question_id);
                console.error(err);
                return callback(err);
            }

            Quiz.find({ questions: { $elemMatch: { $eq: question_id }}}, (err, quizzes) => {
                if(err) {
                    console.error('Error when deleting question from quizzes: ' + question_id);
                    console.error(err);
                    return callback(err);
                }

                var promises = [];

                quizzes.forEach((quiz) => {
                    quiz.questions.pull(question_id);
                    promises.push(quiz.save());
                });

                Promise.all(promises).then(() => callback(), (err) => {
                    console.error('Error when saving quizzes when deleting question: ' + question_id);
                    console.error(err);
                    callback(err);
                });
            });
        });
    });
}

// function getQuestionById(is_admin, question_id, callback) {
//     Question.findById(new ObjectID(question_id))
//             .select(is_admin ? '' : '-correct')
//             .lean()
//             .exec((err, question) => {
//                 if(err) {
//                     console.error('Error when getting question by id: ' + question_id);
//                     console.error(err);
//                     return callback(err);
//                 }

//                 if(question) {
//                     callback(null, question);
//                 } else {
//                     return callback('Question not found with id: ' + question_id);
//                 }
//             });
// }

function getQuestionsByCourse(course_id, callback) {
    Question.find({ course_id: new ObjectID(course_id) })
            .lean()
            .exec((err, results) => {
                if(err) {
                    console.error('Error when getting questions by term');
                    console.error(err);
                    return callback(err);
                }

                callback(null, results);
            });
}

// function getQuestionsByQuiz(is_admin, quiz_id, callback) {
//     Quiz.findById(new ObjectID(quiz_id))
//         .select('questions')
//         .populate('questions', is_admin ? undefined : '-correct')
//         .lean()
//         .exec((err, results) => {
//             if(err) {
//                 console.error('Error when getting questions by quiz');
//                 console.error(err);
//                 return callback(err);
//             }

//             callback(err, results.questions);
//         });
// }

function createQuiz(quiz, callback) {
    var ids = quiz.questions.map((id) => new ObjectID(id));

    Question.find({ _id: { $in: ids }}, (err, results) => {
        var verifiedIds = [];
        quiz.questions.forEach((id) => {
            if(results.findIndex((result) => result.id === id) != -1) {
                verifiedIds.push(id);
            }
        });

        quiz.questions = verifiedIds;

        new Quiz(quiz).save((err) => {
            if(err) {
                console.error('Error when creating quiz: ' + JSON.stringify(quiz, null, 4));
                console.error(err);
            }

            callback(err);
        });
    });
}

function updateQuiz(quiz, required_term_id, callback) {
    if('course_id' in quiz) {
        return callback('Cannot set course_id in quiz.');
    }

    var quiz_id = quiz._id;
    delete quiz._id;

    var do_update = () =>
        Quiz.findById(new ObjectID(quiz_id), (err, result) => {
            if(err) {
                console.error('Error when updating quiz: ' + JSON.stringify(quiz, null, 4));
                console.error(err);
                return callback(err);
            }

            if(!result || String(result.term_id) != required_term_id) {
                return callback('Quiz not found with id: ' + quiz_id);
            }

            if(result.is_published) {
                return callback('Cannot update a published quiz.');
            }

            result.set(quiz);
            result.save((err) => {
                if(err) {
                    console.error('Error when saving quiz: ' + JSON.stringify(quiz, null, 4));
                    console.error(err);
                }

                callback(err);
            });
        });

    if(Array.isArray(quiz.questions)) {
        var ids = quiz.questions.map((id) => new ObjectID(id));

        Question.find({ _id: { $in: ids }}, (err, results) => {
            var verifiedIds = [];
            quiz.questions.forEach((id) => {
                if(results.findIndex((result) => result.id === id) != -1) {
                    verifiedIds.push(id);
                }
            });

            quiz.questions = verifiedIds;

            do_update();
        });
    } else {
        do_update();
    }
}

function updateLiveQuiz(quiz_id, required_term_id, question_idx, callback) {
    Quiz.findById(new ObjectID(quiz_id), (err, quiz) => {
        if(err) {
            console.error('Error when getting live quiz: ' + quiz_id);
            console.error(err);
            return callback(err);
        }

        if(!quiz || String(quiz.term_id) != required_term_id) {
            return callback('Quiz not found with id: ' + quiz_id);
        }

        if(!quiz.is_live) {
            return callback('Not a live a quiz.');
        }

        quiz.set('settings.live_question', question_idx);
        quiz.save((err) => {
            if(err) {
                console.error('Error when updating live quiz: ' + quiz_id);
                console.error(err);
            }

            callback(err);
        });
    });
}

function deleteQuiz(quiz_id, required_term_id, callback) {
    Quiz.findById(new ObjectID(quiz_id), (err, quiz) => {
        if(err) {
            console.error('Error when deleting quiz: ' + quiz_id);
            console.error(err);
            return callback(err);
        }

        if(!quiz || String(quiz.term_id) != required_term_id) {
            return callback('Quiz not found with id: ' + quiz_id);
        }

        quiz.remove((err) => {
            if(err){
                console.error('Error deleting quiz: ' + quiz_id);
                console.error(err);
            }

            callback(err);
        });
    });
}

function processQuiz(is_admin, quiz) {
    if(!is_admin && quiz.is_live) {
        var live_idx = quiz.settings.live_question;
        if(live_idx < 0 || live_idx >= quiz.questions.length) {
            quiz.questions = [];
        } else {
            quiz.questions = [quiz.questions[live_idx]];
        }
    }

    return quiz;
}

function getQuizById(is_admin, quiz_id, callback) {
    var query = Quiz.findById(new ObjectID(quiz_id)).lean();

    if(!is_admin) {
        query = query.populate('questions', '-correct');
    }

    query.exec((err, quiz) => {
        if(err) {
            console.error('Error when getting quiz by id: ' + quiz_id);
            console.error(err);
            return callback(err);
        }

        if(quiz && (is_admin || quiz.is_published)) {
            callback(null, processQuiz(is_admin, quiz));
        } else {
            callback('Quiz not found with id: ' + quiz_id);
        }
    });
}

function getQuizzesByTerm(is_admin, term_id, callback) {
    var query = Quiz.find({ term_id: new ObjectID(term_id) }).lean();

    if(!is_admin) {
        query = query.where({ is_published: true }).populate('questions', '-correct');
    }

    query.exec((err, quizzes) => {
        if(err) {
            console.error('Error when getting all quizzes for term: ' + term_id);
            console.error(err);
            return callback(err);
        }

        callback(null, quizzes.map((q) => processQuiz(is_admin, q)));
    });
}

function submitQuiz(username, submission, callback) {
    if(!submission || !submission.answers) {
        return callback('Invalid submission object.');
    }

    Quiz.findById(new ObjectID(submission.quiz_id))
        .populate('questions')
        .exec((err, quiz) => {
            if(err) {
                console.error('Error when getting quiz and questions ' + submission.quiz_id);
                console.error(err);
                return callback(err);
            }

            if(!quiz) {
                return callback('Invalid quiz id: ' + submission.quiz_id);
            }

            if(!quiz.is_published) {
                return callback('Cannot have a submission for an unpublished quiz: ' + submission.quiz_id);
            }

            var newSubmission = () => {
                var to_submit = new Submission({
                    username: username,
                    term_id: submission.term_id,
                    quiz_id: submission.quiz_id,
                    answers: []
                });

                to_submit.quiz_name = quiz.name;

                quiz.questions.forEach((question) => {
                    var id = question.id;

                    to_submit.answers.push({
                        question_id: id,
                        title: question.title,
                        answer: submission.answers[id],
                        score: submission.answers[id] == question.correct ? 1 : 0,
                        total: 1
                    });
                });

                to_submit.save((err) => {
                    if(err) {
                        console.error('Error when creating submission: ' + to_submit.toJSON());
                        console.error(err);
                    }

                    callback(err);
                });
            }

            if(quiz.is_live) {
                Submission.find({ username: username, quiz_id: new ObjectID(submission.quiz_id) }, (err, submissions) => {
                    if(err) {
                        console.error('Error getting past submission for quiz: ' + submission.quiz_id);
                        console.error(err);
                        return callback(err);
                    }

                    if(submissions.length == 0) {
                        return newSubmission();
                    }

                    if(submissions.length > 1) {
                        console.error('Inconsistency found, live quiz cannot have more than 1 submission! Username: ' + username + ', Quiz: ' + submission.quiz_id);
                        return callback('Internal error, inconsistency found with live quiz having more than 1 submission.');
                    }

                    var to_submit = submissions[0];

                    Object.keys(submission.answers).forEach((id) => {
                        var idx = quiz.questions.findIndex((question) => question.id == id);
                        if(idx != -1) {
                            to_submit.answers.set(idx, {
                                question_id: id,
                                title: to_submit.answers[idx].title,
                                answer: submission.answers[id],
                                score: submission.answers[id] == quiz.questions[idx].correct ? 1 : 0,
                                total: 1
                            });
                        }
                    });

                    to_submit.save((err) => {
                        if(err) {
                            console.error('Error when updating submission: ' + JSON.stringify(to_submit.toJSON()));
                            console.error(err);
                        }

                        callback(err);
                    });
                });
            } else {
                newSubmission();
            }
        });
}

function getSubmissionsByUser(username, term_id, callback) {
    Submission.find({ username: username, term_id: term_id })
            .sort({ username: 1, timestamp: 1 })
            .lean()
            .exec((err, results) => {
                if(err) {
                    console.error('Error when getting submissions for user: ' + username);
                    console.error(err);
                    return callback(err);
                }

                callback(null, results);
            });
}

function getSubmissionsByTerm(term_id, callback) {
    // if(!user.admin && !user.permissions.can_view_class_stats) {
    //     return callback('Permission denied');
    // }

    Submission.find({ term_id: term_id })
            .sort({ username: 1, timestamp: 1 })
            .lean()
            .exec((err, results) => {
                if(err) {
                    console.error('Error when getting submissions for term: ' + term_id);
                    console.error(err);
                    return callback(err);
                }

                callback(null, results);
            });
}
