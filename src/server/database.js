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
    createInvitation: createInvitation,

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
mongoose.Promise = Promise;
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
        term_id: { type: Schema.Types.ObjectId, ref: 'Term' },
        course_id: { type: Schema.Types.ObjectId, ref: 'Course' },
        school_id: { type: Schema.Types.ObjectId, ref: 'School' }
    }
});
usersSchema.post('save', (user) => events.emit('user', cleanupUser(user.toJSON())));
const User = mongoose.model('User', usersSchema);

const sessionsSchema = new Schema({
    _id: { type: String, required: true, unique: true },
    user: { type: String, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now }
});
sessionsSchema.index({ createdAt: 1 }, { background: true, expireAfterSeconds: 24 * 60 * 60 });
const Session = mongoose.model('Session', sessionsSchema);

const invitationsSchema = new Schema({
    _id: { type: String, required: true, index: true },
    term_id: { type: Schema.Types.ObjectId, ref: 'Term', required: true },
    createdAt: { type: Date, default: Date.now }
});
invitationsSchema.index({ createdAt: 1 }, { background: true, expireAfterSeconds: 15 * 60 });
const Invitation = mongoose.model('Invitation', invitationsSchema);

const resourcesSchema = new Schema({
    data: { type: String, required: true },
});
const Resource = mongoose.model('Resource', resourcesSchema);

const questionsSchema = new Schema({
    course_id: { type: Schema.Types.ObjectId, required: true, index: true },
    title: { type: String, trim: true, required: true },
    tags: [{ type: String, lowercase: true, trim: true, required: true }],
    answers: { type: [{ type: String, trim: true, required: true }], required: true, validate: [(a) => a.length >= 2, 'Minimum 2 answers needed.'] },
    correct: {                                                // index into answers array,
        type: Number,
        required: true,
        validate: [function(n) { return n % 1 === 0 && n >= 0 && n < this.answers.length; }, 'Correct index out of bounds.']
    },
    // answer_type: { type: String, enum: ['multiple-choice', 'multiple-answer', 'answer-write-in', 'free-response']}
    // multiple_choice: {
    //     choices: {
    //         type: [{ type: String, trim: true, required: true }],
    //         required: true,
    //         validate: [function(a) { return this.answer_type == 'multiple-choice' && a.length >= 2; }, 'Minimum 2 choices needed.']
    //     },
    //     correct: {
    //         type: Number,
    //         validate: [function(n) {
    //                         return this.answer_type == 'multiple-choice' && n % 1 === 0 && n >= 0 && n < this.multiple_choice.choices.length;
    //                     }, 'Correct index out of bounds.']
    //     },
    // },
    // multiple_answer: {
    //     choices: {
    //         type: [{ type: String, trim: true, required: true }],
    //         required: true,
    //         validate: [function(a) { return !a || (this.answer_type == 'multiple-answer' && a.length >= 3) }, 'Minimum 3 choices needed.']
    //     },
    //     correct: {
    //         type: [{
    //             type: Number,
    //             validate: [function(n) { return n % 1 === 0 && n >= 0 && n < this.multiple_answer.choices.length; }, 'Correct index out of bounds.']
    //         }],
    //         validate: [function(n) { return !n || this.answer_type == 'multiple-answer' }, 'Incorrect field set']
    //     }
    // },
    // answer_write_in: {
    //     correct: {
    //         type: [String],
    //         validate: [function(n) { return !n || this.answer_type == 'answer-write-in'}, 'Incorrect field set']
    //     }
    // },
    // free_response: {
    //     max_length: Number
    // },
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
        type: [{ type: Schema.Types.ObjectId, ref: 'Question', required: true }],
        default: []
    },
    settings: {
        live_question: { type: Number, default: -1 },
        open_date: {
            type: Date,
            required: true,
            validate: [function(open_date) { return new Date(open_date) < this.settings.close_date }, 'Open date is not less than close_date.']
        },
        close_date: {
            type: Date,
            required: true,
            validate: [function(close_date) { return this.settings.open_date < new Date(close_date) }, 'Close date is not greater than open_date.']
        },
        max_submission: {
            type: Number,
            default: 0,
            validate: [(n) => (n >= 0) && (n % 1 == 0), 'Max submissions must be a positive integer or 0.']
        },

        allow_submission_review: { type: Boolean, default: false },
        submission_review_after_close: { type: Boolean, default: true },

        allow_score_review: { type: Boolean, default: false },
        score_review_after_close: { type: Boolean, default: true },

        allow_correct_review: { type: Boolean, default: false },
        correct_review_after_close: { type: Boolean, default: true },

        choose_highest_score: { type: Boolean, default: true }
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
            options: { type: Number, required: true },
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


function handleError(err, callback) {
    var msg = err.errors ? Object.keys(err.errors).map((prop) => err.errors[prop].message).join(' ') : String(err);

    console.error(msg);
    callback(msg)
}

function createUser(username, passwords, invitation, callback) {
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
            return handleError(err, callback);
        }

        if(result) {
            return callback('This username is already taken.');
        }

        crypto.randomBytes(128, (err, buf) => {
            if(err) {
                console.error('Error when generating salt when creating user: ' + username);
                return handleError(err, callback);
            }

            var salt = buf.toString('base64');
            var iterations = 100000;
            crypto.pbkdf2(password, salt, iterations, 512, 'sha512', (err, buf) => {
                if(err) {
                    console.error('Error when generating hash when creating user: ' + username);
                    return handleError(err, callback);
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
                        return handleError(err, callback);
                    }

                    if(invitation) {
                        handleInvitation(username, invitation, callback);
                    } else {
                        callback(null, result);
                    }
                });
            });
        });
    });
}

function createSession(username, password, invitation, callback) {
    if(!username || !password) {
        return callback('Username and password cannot be empty.');
    }

    User.findById(username, (err, result) => {
        if(err) {
            console.error('Error when creating session: ' + username);
            return handleError(err, callback);
        }

        if(result) {
            crypto.pbkdf2(password, result.auth.salt, result.auth.iterations, 512, 'sha512', (err, buf) => {
                var hash = buf.toString('base64');

                if(hash == result.auth.hash) {
                    crypto.randomBytes(128, (err, buf) => {
                        if(err) {
                            console.error('Error when generating session id: ' + username);
                            return handleError(err, callback);
                        }

                        var id = buf.toString('base64');

                        new Session({
                            _id: id,
                            user: username
                        }).save((err) => {
                            if(err) {
                                console.error('Error when saving session: ' + username);
                                return handleError(err, callback);
                            }

                            if(invitation) {
                                handleInvitation(username, invitation, (err) => {
                                    callback(err, id);
                                });
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
                return handleError(err, callback);
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
            return handleError(err, callback);
        }

        callback();
    });
}

function getUser(username, callback) {
    User.findById(username)
        .select('-auth')
        .lean()
        .exec((err, user) => {
            if(err) {
                console.error('Error when getting user: ' + username);
                return handleError(err, callback);
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
            return handleError(err, callback);
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
                    return handleError(err, callback);
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

                callback(null, users);
            });
    });
}

function createSchool(school, callback) {
    new School(school).save((err, school) => {
        if(err) {
            console.error('Error when creating school: ' + school);
            return handleError(err, callback);
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
            return handleError(err, callback);
        }

        if(!school) {
            return callback('Did not find school: ' + school_id);
        }

        school.set(new_school);
        school.save((err) => {
            if(err) {
                console.error('Error when saving updated school: ' + school);
                return handleError(err, callback);
            }

            callback();
        });
    });
}

function getSchools(callback) {
    School.find((err, schools) => {
        if(err) {
            console.error('Error when getting schools');
            return handleError(err, callback);
        }

        callback(null, schools);
    });
}

function createCourse(course, callback) {
    new Course(course).save((err, course) => {
        if(err) {
            console.error('Error when creating course: ' + course);
            return handleError(err, callback);
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
            return handleError(err, callback);
        }

        if(!course) {
            return callback('Did not find course: ' + course_id);
        }

        course.set(new_course);
        course.save((err) => {
            if(err) {
                console.error('Error when saving updated course: ' + course);
                return handleError(err, callback);
            }

            callback();
        });
    });
}

function getCourses(school_id, callback) {
    Course.find({ school_id: new ObjectID(school_id) }, (err, courses) => {
        if(err) {
            console.error('Error when getting courses for school: ' + school_id);
            return handleError(err, callback);
        }

        callback(null, courses);
    });
}

function createTerm(user, term, callback) {
    new Term(term).save((err, term) => {
        if(err) {
            console.error('Error when creating term: ' + term);
            return handleError(err, callback);
        }

        addUser(term.id, user.username, { isCreator: true }, (err) => {
            if(err) {
                return handleError(err, callback);
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
            return handleError(err, callback);
        }

        if(!term) {
            return callback('Did not find term: ' + term_id);
        }

        term.set(new_term);
        term.save((err) => {
            if(err) {
                console.error('Error when saving updated term: ' + term);
                return handleError(err, callback);
            }

            callback();
        });
    });
}

function getTerms(course_id, callback) {
    Term.find({ course_id: new ObjectID(course_id) }, (err, terms) => {
        if(err) {
            console.error('Error when getting terms for course: ' + course_id);
            return handleError(err, callback);
        }

        callback(null, terms);
    });
}

function addUser(term_id, username, permissions, callback) {
    Term.findById(new ObjectID(term_id), (err, term) => {
        if(err) {
            console.error('Error when getting term: ' + term_id);
            return handleError(err, callback);
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
                return handleError(err, callback);
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
                    return handleError(err, callback);
                } else {
                    user.permissions.push(permissions);
                    user.save((err) => {
                        if(err) {
                            console.error('Error when saving user permissions for ' + username);
                            return handleError(err, callback);
                        }

                        callback();
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
            return handleError(err, callback);
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
                return handleError(err, callback);
            }

            if(!user) {
                term.users.pull(username);
                term.save((err) => {
                    if(err) {
                        console.error('Error when removing user: ' + term_id + ', ' + username);
                        return handleError(err, callback);
                    }
                    
                    callback('User not found.');
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
                    return handleError(err, callback);
                }

                term.users.pull(username);
                term.save((err) => {
                    if(err) {
                        console.error('Error when removing user: ' + term_id + ', ' + username);
                        return handleError(err, callback);
                    }
                    
                    callback();
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
            return handleError(err, callback);
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
                return handleError(err, callback);
            }

            callback();
        });
    });
}

function createInvitation(term_id, callback) {
    Term.findById(new ObjectID(term_id), (err, term) => {
        if(err) {
            console.error('Error when getting term for creating invitation: ' + term_id);
            return handleError(err, callback);
        }

        if(!term) {
            return callback('Term not found');
        }

        crypto.randomBytes(32, (err, buf) => {
            if(err) {
                console.error('Error generating invitation id for term: ' + term_id);
                return handleError(err, callback);
            }

            var id = buf.toString('hex');

            new Invitation({ _id: id, term_id: term_id }).save((err) => {
                if(err) {
                    console.error('Error saving invitation for term: ' + term_id);
                    return handleError(err, callback);
                }

                callback(null, id);
            });
        });
    });
}

function handleInvitation(username, invitation_id, callback) {
    Invitation.findById(invitation_id, (err, invitation) => {
        if(err) {
            console.error('Error getting invitation: ' + invitation_id);
            return handleError(err, callback);
        }

        if(!invitation) {
            return callback('Invitation not found: ' + invitation_id);
        }

        addUser(invitation.term_id, username, {}, callback);
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
                return handleError(err, callback);
            }

            if(!term) {
                return callback('Did not find term: ' + term_id);
            }

            User.findById(username, '-auth', (err, user) => {
                if(err) {
                    console.error('Error when getting user: ' + username);
                    return handleError(err, callback);
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
            return handleError(err, callback);
        }

        callback(null, result.id);
    });
}

function deleteResource(resource_id, callback) {
    Resource.findByIdAndRemove(new ObjectID(resource_id), (err) => {
        if(err) {
            console.error('Error when deleting resource: ' + resource_id);
            return handleError(err, callback);
        }

        callback();
    });
}

function getResource(resource_id, callback) {
    Resource.findById(new ObjectID(resource_id)).lean().exec((err, resource) => {
        if(err) {
            console.error('Error when getting resource: ' + resource_id);
            return handleError(err, callback);
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
            return handleError(err, callback);
        }

        callback();
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
            return handleError(err, callback);
        }

        if(!result || String(result.course_id) != required_course_id) {
            return callback('Question not found with id: ' + question_id);
        }

        result.set(question);
        result.save((err) => {
            if(err) {
                console.error('Error when saving question: ' + JSON.stringify(question, null, 4));
                return handleError(err, callback);
            }

            callback();
        });
    });
}

function deleteQuestion(question_id, required_course_id, callback) {
    question_id = new ObjectID(question_id);

    Question.findById(question_id, (err, question) => {
        if(err) {
            console.error('Error when deleting question: ' + question_id);
            return handleError(err, callback);
        }

        if(!question || String(question.course_id) != required_course_id) {
            return callback('Question not found with id: ' + question_id);
        }

        question.remove((err) => {
            if(err) {
                console.error('Error deleting question: ' + question_id);
                return handleError(err, callback);
            }

            Quiz.find({ questions: { $elemMatch: { $eq: question_id }}}, (err, quizzes) => {
                if(err) {
                    console.error('Error when deleting question from quizzes: ' + question_id);
                    return handleError(err, callback);
                }

                var promises = [];

                quizzes.forEach((quiz) => {
                    quiz.questions.pull(question_id);
                    promises.push(quiz.save());
                });

                Promise.all(promises).then(() => callback(), (err) => {
                    console.error('Error when saving quizzes when deleting question: ' + question_id);
                    return handleError(err, callback);
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
                    return handleError(err, callback);
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
                return handleError(err, callback);
            }

            callback();
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
                return handleError(err, callback);
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
                    return handleError(err, callback);
                }

                callback();
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
            return handleError(err, callback);
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
                return handleError(err, callback);
            }

            callback();
        });
    });
}

function deleteQuiz(quiz_id, required_term_id, callback) {
    Quiz.findById(new ObjectID(quiz_id), (err, quiz) => {
        if(err) {
            console.error('Error when deleting quiz: ' + quiz_id);
            return handleError(err, callback);
        }

        if(!quiz || String(quiz.term_id) != required_term_id) {
            return callback('Quiz not found with id: ' + quiz_id);
        }

        quiz.remove((err) => {
            if(err){
                console.error('Error deleting quiz: ' + quiz_id);
                return handleError(err, callback);
            }

            callback();
        });
    });
}

function processQuiz(is_admin, quiz) {
    if(!is_admin) {
        if(quiz.is_live) {
            var live_idx = quiz.settings.live_question;
            if(live_idx < 0 || live_idx >= quiz.questions.length) {
                quiz.questions = [];
            } else {
                quiz.questions = [quiz.questions[live_idx]];
            }
        }

        if(!quiz.settings.allow_correct_review && (new Date() <= quiz.settings.close_date || !quiz.settings.correct_review_after_close)) {
            quiz.questions.forEach((question) => delete question.correct);
        }
    }

    return quiz;
}

function getQuizById(is_admin, quiz_id, callback) {
    var query = Quiz.findById(new ObjectID(quiz_id)).lean();

    if(!is_admin) {
        query = query.populate('questions');
    }

    query.exec((err, quiz) => {
        if(err) {
            console.error('Error when getting quiz by id: ' + quiz_id);
            return handleError(err, callback);
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
        query = query.where({ is_published: true }).populate('questions');
    }

    query.exec((err, quizzes) => {
        if(err) {
            console.error('Error when getting all quizzes for term: ' + term_id);
            return handleError(err, callback);
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
                return handleError(err, callback);
            }

            if(!quiz) {
                return callback('Invalid quiz id: ' + submission.quiz_id);
            }

            if(!quiz.is_published) {
                return callback('Cannot have a submission for an unpublished quiz: ' + submission.quiz_id);
            }

            if(String(quiz.term_id) != submission.term_id) {
                return callback('Incorrect term_id for quiz: ' + submission.quiz_id);
            }

            if(new Date() < quiz.settings.open_date || new Date() > quiz.settings.close_date) {
                return callback('Quiz is not active.');
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
                        options: question.answers.length,
                        answer: submission.answers[id],
                        score: submission.answers[id] == question.correct ? 1 : 0,
                        total: 1
                    });
                });

                to_submit.save((err) => {
                    if(err) {
                        console.error('Error when creating submission: ' + to_submit.toJSON());
                        return handleError(err, callback);
                    }

                    callback();
                });
            }

            Submission.find({ username: username, quiz_id: new ObjectID(submission.quiz_id) }, (err, submissions) => {
                if(err) {
                    console.error('Error getting past submission for quiz: ' + submission.quiz_id);
                    return handleError(err, callback);
                }

                if(submissions.length == 0) {
                    return newSubmission();
                }

                if(quiz.is_live) {
                    if(submissions.length > 1) {
                        console.error('Inconsistency found, live quiz cannot have more than 1 submission! Username: ' + username + ', Quiz: ' + submission.quiz_id);
                        return callback('Internal error, inconsistency found with live quiz having more than 1 submission.');
                    }

                    var to_submit = submissions[0];

                    var answers = Object.keys(submission.answers);
                    if(answers.length != 1) {
                        return callback('Can only submit 1 question at a time for live quizzes.');
                    }

                    var id = answers[0];
                    var idx = quiz.questions.findIndex((question) => question.id == id);

                    if(idx != quiz.settings.live_question) {
                        return callback('Cannot submit answer for non-live question.');
                    }

                    if(idx != -1) {
                        to_submit.answers.set(idx, {
                            question_id: id,
                            title: to_submit.answers[idx].title,
                            options: quiz.questions[idx].answers.length,
                            answer: submission.answers[id],
                            score: submission.answers[id] == quiz.questions[idx].correct ? 1 : 0,
                            total: 1
                        });
                    }

                    to_submit.save((err) => {
                        if(err) {
                            console.error('Error when updating submission: ' + JSON.stringify(to_submit.toJSON()));
                            return handleError(err, callback);
                        }

                        callback();
                    });
                } else if(quiz.settings.max_submission == 0 || submissions.length < quiz.settings.max_submission) {
                    newSubmission();
                } else {
                    return callback('Reached submission limit.');
                }
            });
        });
}

function getSubmissionsByUser(username, term_id, callback) {
    Submission.find({ username: username, term_id: term_id })
            .populate('quiz_id')
            .sort({ username: 1, timestamp: 1 })
            .lean()
            .exec((err, results) => {
                if(err) {
                    console.error('Error when getting submissions for user: ' + username);
                    return handleError(err, callback);
                }

                var toSend = [];

                results.forEach((submission) => {
                    var quiz = submission.quiz_id;
                    if(!quiz) return;

                    var isClosed = new Date() > quiz.settings.close_date;

                    if(!quiz.settings.allow_submission_review && (!isClosed || !quiz.settings.submission_review_after_close)) {
                        submission.answers = [];
                    } else if(!quiz.settings.allow_score_review && (!isClosed || !quiz.settings.score_review_after_close)) {
                        submission.answers.forEach((answer) => {
                            delete answer.score;
                        });
                    }

                    toSend.push(submission);
                });

                callback(null, toSend);
            });
}

function getSubmissionsByTerm(term_id, callback) {
    Submission.find({ term_id: term_id })
            .sort({ username: 1, timestamp: 1 })
            .lean()
            .exec((err, results) => {
                if(err) {
                    console.error('Error when getting submissions for term: ' + term_id);
                    return handleError(err, callback);
                }

                callback(null, results);
            });
}
