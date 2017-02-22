'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

window.onload = function () {
    socket.on('login', function (success) {
        if (success) {
            socket.send('get_quizzes', function (err, data) {
                if (!err) {
                    socket.emit('quizzes', data);
                }
            });
            socket.send('get_questions', function (err, data) {
                if (!err) {
                    socket.emit('questions', data);
                }
            });
            socket.send('get_live_question', function (err, data) {
                if (!err) {
                    socket.emit('live_question', data);
                }
            });
        }
    });

    ReactDOM.render(React.createElement(Panels, null), document.getElementById('panels'));
};

var Panels = function (_React$Component) {
    _inherits(Panels, _React$Component);

    function Panels(props) {
        _classCallCheck(this, Panels);

        var _this = _possibleConstructorReturn(this, (Panels.__proto__ || Object.getPrototypeOf(Panels)).call(this, props));

        _this.state = {
            questions: {},
            quizzes: {},

            selectedQuiz: null,
            showConfirm: null,

            showLiveQuestion: false,
            currentLiveQuestion: null
        };

        socket.on('questions', function (data) {
            return _this.setState({ questions: data });
        });
        socket.on('quizzes', function (data) {
            return _this.setState({ quizzes: data });
        });
        socket.on('live_question', function (data) {
            return _this.setState({ currentLiveQuestion: data });
        });
        return _this;
    }

    _createClass(Panels, [{
        key: 'toggleLiveQuiz',
        value: function toggleLiveQuiz() {
            this.setState({ showLiveQuestion: !this.state.showLiveQuestion });

            socket.send('live_question', function (err, data, request) {
                if (!err) {
                    socket.emit('live_question', data);
                } else {
                    console.error('Error sending ' + JSON.stringify(request) + ': ' + err);
                }
            });
        }
    }, {
        key: 'chooseQuiz',
        value: function chooseQuiz(id) {
            if (!this.state.selectedQuiz || confirm('Discard current quiz?')) {
                this.setState({ selectedQuiz: id, showConfirm: null });
            }
        }
    }, {
        key: 'confirmSubmit',
        value: function confirmSubmit(submission) {
            this.setState({ showConfirm: submission });
        }
    }, {
        key: 'doneSubmit',
        value: function doneSubmit(success) {
            if (success) {
                this.setState({ selectedQuiz: null, showConfirm: null });
            } else {
                this.setState({ showConfirm: null });
            }
        }
    }, {
        key: 'render',
        value: function render() {
            return React.createElement(
                'div',
                null,
                (this.state.showLiveQuestion || this.state.showConfirm) && React.createElement('div', { id: 'overlay' }),
                this.state.showLiveQuestion && React.createElement(LiveQuizPanel, {
                    question: this.state.currentLiveQuestion,
                    toggleLiveQuiz: this.toggleLiveQuiz.bind(this) }),
                this.state.showConfirm && React.createElement(ConfirmBox, { submission: this.state.showConfirm, doneSubmit: this.doneSubmit.bind(this) }),
                React.createElement(
                    'div',
                    { className: (this.state.showLiveQuestion || this.state.showConfirm) && 'blur' },
                    React.createElement(QuizPanel, {
                        quizzes: this.state.quizzes,
                        chooseQuiz: this.chooseQuiz.bind(this),
                        toggleLiveQuiz: this.toggleLiveQuiz.bind(this) }),
                    React.createElement(QuestionPanel, {
                        questions: this.state.questions,
                        quiz: this.state.selectedQuiz && this.state.quizzes[this.state.selectedQuiz],
                        submitQuiz: this.confirmSubmit.bind(this) })
                )
            );
        }
    }]);

    return Panels;
}(React.Component);

var LiveQuizPanel = function (_React$Component2) {
    _inherits(LiveQuizPanel, _React$Component2);

    function LiveQuizPanel() {
        _classCallCheck(this, LiveQuizPanel);

        return _possibleConstructorReturn(this, (LiveQuizPanel.__proto__ || Object.getPrototypeOf(LiveQuizPanel)).apply(this, arguments));
    }

    _createClass(LiveQuizPanel, [{
        key: 'render',
        value: function render() {
            return React.createElement(
                'div',
                { id: 'live-quiz' },
                this.props.question ? React.createElement(
                    'ul',
                    { id: 'live-question' },
                    React.createElement(Question, { question: this.props.question })
                ) : React.createElement(
                    'p',
                    { id: 'live-question-msg' },
                    'Live question has ended.'
                ),
                React.createElement(
                    'button',
                    { onClick: this.props.toggleLiveQuiz, className: 'delete-button' },
                    '\u2716'
                )
            );
        }
    }]);

    return LiveQuizPanel;
}(React.Component);

var ConfirmBox = function (_React$Component3) {
    _inherits(ConfirmBox, _React$Component3);

    function ConfirmBox(props) {
        _classCallCheck(this, ConfirmBox);

        var _this3 = _possibleConstructorReturn(this, (ConfirmBox.__proto__ || Object.getPrototypeOf(ConfirmBox)).call(this, props));

        _this3.state = {
            isSubmitting: false,
            doneSubmitting: false
        };
        return _this3;
    }

    _createClass(ConfirmBox, [{
        key: 'cancelSubmit',
        value: function cancelSubmit() {
            if (!this.state.isSubmitting) {
                this.props.doneSubmit(false);
            }
        }
    }, {
        key: 'submitQuiz',
        value: function submitQuiz() {
            var _this4 = this;

            if (!this.state.isSubmitting) {
                this.setState({ isSubmitting: true });

                console.log(this.props.submission);

                socket.send('submit_quiz', this.props.submission, function (err, data, request) {
                    _this4.setState({ isSubmitting: false });

                    if (err) {
                        alert('Failed to submit, please trying again. Error: ' + err);
                    } else {
                        _this4.setState({ doneSubmitting: true });
                    }
                });
            }
        }
    }, {
        key: 'doneSubmitting',
        value: function doneSubmitting() {
            this.props.doneSubmit(true);
        }
    }, {
        key: 'render',
        value: function render() {
            return React.createElement(
                'div',
                { id: 'confirm-box' },
                this.state.doneSubmitting ? React.createElement(
                    'div',
                    null,
                    React.createElement(
                        'p',
                        { id: 'confirm-msg' },
                        'Your answers have been submitted.'
                    ),
                    React.createElement(
                        'button',
                        { onClick: this.doneSubmitting.bind(this), id: 'ok-button' },
                        'OK'
                    )
                ) : React.createElement(
                    'div',
                    null,
                    React.createElement(
                        'p',
                        { id: 'confirm-msg' },
                        'Are you sure you want to submit this quiz?'
                    ),
                    React.createElement(
                        'button',
                        {
                            onClick: !this.state.isSubmitting && this.cancelSubmit.bind(this),
                            className: 'cancel-button' },
                        'Cancel'
                    ),
                    React.createElement(
                        'button',
                        {
                            onClick: !this.state.isSubmitting && this.submitQuiz.bind(this),
                            className: 'submit-confirm-button' },
                        'Submit'
                    )
                )
            );
        }
    }]);

    return ConfirmBox;
}(React.Component);

var QuizPanel = function (_React$Component4) {
    _inherits(QuizPanel, _React$Component4);

    function QuizPanel() {
        _classCallCheck(this, QuizPanel);

        return _possibleConstructorReturn(this, (QuizPanel.__proto__ || Object.getPrototypeOf(QuizPanel)).apply(this, arguments));
    }

    _createClass(QuizPanel, [{
        key: 'render',
        value: function render() {
            return React.createElement(
                'div',
                { id: 'quiz-panel' },
                React.createElement(
                    'button',
                    { className: 'option-button', onClick: this.props.toggleLiveQuiz },
                    'Live Quiz'
                ),
                React.createElement(QuizList, { quizzes: this.props.quizzes, chooseQuiz: this.props.chooseQuiz })
            );
        }
    }]);

    return QuizPanel;
}(React.Component);

var QuizList = function (_React$Component5) {
    _inherits(QuizList, _React$Component5);

    function QuizList() {
        _classCallCheck(this, QuizList);

        return _possibleConstructorReturn(this, (QuizList.__proto__ || Object.getPrototypeOf(QuizList)).apply(this, arguments));
    }

    _createClass(QuizList, [{
        key: 'render',
        value: function render() {
            var _this7 = this;

            return React.createElement(
                'ol',
                { id: 'quiz-list' },
                Object.keys(this.props.quizzes).map(function (id) {
                    var quiz = _this7.props.quizzes[id];
                    var chooseQuizId = _this7.props.chooseQuiz.bind(null, id);
                    return React.createElement(
                        'li',
                        { key: id, id: 'quiz-' + id, className: 'quiz' },
                        React.createElement(
                            'button',
                            { className: 'quiz-body', onClick: chooseQuizId },
                            unescapeHTML(quiz.name)
                        )
                    );
                })
            );
        }
    }]);

    return QuizList;
}(React.Component);

var QuestionPanel = function (_React$Component6) {
    _inherits(QuestionPanel, _React$Component6);

    function QuestionPanel() {
        _classCallCheck(this, QuestionPanel);

        return _possibleConstructorReturn(this, (QuestionPanel.__proto__ || Object.getPrototypeOf(QuestionPanel)).apply(this, arguments));
    }

    _createClass(QuestionPanel, [{
        key: 'render',
        value: function render() {
            return React.createElement(
                'div',
                { id: 'question-panel' },
                React.createElement(
                    'h2',
                    { id: 'quiz-title' },
                    this.props.quiz ? this.props.quiz.name : 'Quiz'
                ),
                this.props.quiz ? React.createElement(QuestionList, { quiz: this.props.quiz, questions: this.props.questions, submitQuiz: this.props.submitQuiz }) : React.createElement(
                    'p',
                    { id: 'choose-quiz-msg' },
                    'Choose a quiz from the left side!'
                )
            );
        }
    }]);

    return QuestionPanel;
}(React.Component);

var QuestionList = function (_React$Component7) {
    _inherits(QuestionList, _React$Component7);

    function QuestionList(props) {
        _classCallCheck(this, QuestionList);

        var _this9 = _possibleConstructorReturn(this, (QuestionList.__proto__ || Object.getPrototypeOf(QuestionList)).call(this, props));

        _this9.answers = {};
        return _this9;
    }

    _createClass(QuestionList, [{
        key: 'answerSelected',
        value: function answerSelected(id, value) {
            this.answers[id] = value;
        }
    }, {
        key: 'submitClicked',
        value: function submitClicked() {
            this.props.submitQuiz({
                quiz_id: this.props.quiz.id,
                answers: this.answers
            });
        }
    }, {
        key: 'render',
        value: function render() {
            var _this10 = this;

            return React.createElement(
                'div',
                null,
                React.createElement(
                    'ol',
                    { id: 'question-list' },
                    this.props.quiz.questions.map(function (question_id) {
                        return React.createElement(Question, {
                            key: question_id,
                            question: _this10.props.questions[question_id],
                            answerSelected: _this10.answerSelected.bind(_this10, question_id) });
                    })
                ),
                React.createElement(
                    'button',
                    { id: 'submit-all', className: 'submit-all-button', onClick: this.submitClicked.bind(this) },
                    'Submit All'
                )
            );
        }
    }]);

    return QuestionList;
}(React.Component);

var Question = function (_React$Component8) {
    _inherits(Question, _React$Component8);

    function Question() {
        _classCallCheck(this, Question);

        return _possibleConstructorReturn(this, (Question.__proto__ || Object.getPrototypeOf(Question)).apply(this, arguments));
    }

    _createClass(Question, [{
        key: 'answerSelected',
        value: function answerSelected(e) {
            this.props.answerSelected(e.target.value);
        }
    }, {
        key: 'render',
        value: function render() {
            var _this12 = this;

            return React.createElement(
                'li',
                { className: 'question' },
                React.createElement(
                    'div',
                    { className: 'question-body', style: this.props.question.image ? { width: '70%' } : {} },
                    React.createElement(
                        'p',
                        { className: 'question-name' },
                        unescapeHTML(this.props.question.name)
                    ),
                    React.createElement(
                        'ol',
                        { className: 'answer-list' },
                        this.props.question.answers.map(function (answer, idx) {
                            return React.createElement(
                                'li',
                                { key: answer + idx, className: 'answer' },
                                React.createElement('input', {
                                    type: 'radio',
                                    name: 'answers-' + _this12.props.question.id,
                                    value: idx,
                                    onChange: _this12.answerSelected.bind(_this12) }),
                                unescapeHTML(answer)
                            );
                        })
                    )
                ),
                React.createElement('img', { className: 'question-image', src: this.props.question.image || null })
            );
        }
    }]);

    return Question;
}(React.Component);