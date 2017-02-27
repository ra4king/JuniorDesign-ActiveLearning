'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var IndexLink = ReactRouter.IndexLink;

window.onload = function () {
    var Router = ReactRouter.Router;
    var Route = ReactRouter.Route;
    var IndexRoute = ReactRouter.IndexRoute;
    var browserHistory = ReactRouter.browserHistory;

    ReactDOM.render(React.createElement(
        Router,
        { history: browserHistory },
        React.createElement(
            Route,
            { path: '/active-learning/', component: App },
            React.createElement(IndexRoute, { component: Panels }),
            React.createElement(Route, { path: '/active-learning/statistics', component: StatisticsPanels })
        )
    ), document.getElementById('panels'));
};

var App = function (_React$Component) {
    _inherits(App, _React$Component);

    function App(props) {
        _classCallCheck(this, App);

        var _this = _possibleConstructorReturn(this, (App.__proto__ || Object.getPrototypeOf(App)).call(this, props));

        _this.state = {
            showConfirm: null,
            showLiveQuestion: false,
            currentLiveQuestion: null
        };

        socket.on('login', function (user) {
            if (user) {
                _this.setState({ user: user });
            }
        });
        socket.on('live_question', function (data) {
            return _this.setState({ currentLiveQuestion: data });
        });
        return _this;
    }

    _createClass(App, [{
        key: 'toggleLiveQuiz',
        value: function toggleLiveQuiz() {
            this.setState({ showLiveQuestion: !this.state.showLiveQuestion });

            socket.send('live_question', function (err, data) {
                if (!err) {
                    socket.emit('live_question', data);
                } else {
                    console.error('Error sending request for live question id: ' + err);
                }
            });
        }
    }, {
        key: 'showConfirm',
        value: function showConfirm(options) {
            this.setState({ showConfirm: options });
        }
    }, {
        key: 'hideConfirm',
        value: function hideConfirm() {
            this.setState({ showConfirm: null });
        }
    }, {
        key: 'render',
        value: function render() {
            var _this2 = this;

            return React.createElement(
                'div',
                null,
                (this.state.showLiveQuestion || this.state.showConfirm) && React.createElement('div', { id: 'overlay' }),
                this.state.showLiveQuestion && React.createElement(LiveQuizPanel, {
                    question: this.state.currentLiveQuestion,
                    toggleLiveQuiz: this.toggleLiveQuiz.bind(this) }),
                this.state.showConfirm && React.createElement(ConfirmBox, _extends({ hideConfirm: function hideConfirm() {
                        return _this2.hideConfirm();
                    } }, this.state.showConfirm)),
                React.createElement(
                    'div',
                    { className: (this.state.showLiveQuestion || this.state.showConfirm) && 'blur' },
                    React.createElement(HeaderPanel, { user: this.state.user, page: this.state.page }),
                    React.Children.map(this.props.children, function (child) {
                        return React.cloneElement(child, {
                            user: _this2.state.user,
                            showConfirm: _this2.showConfirm.bind(_this2),
                            toggleLiveQuiz: _this2.toggleLiveQuiz.bind(_this2)
                        });
                    })
                )
            );
        }
    }]);

    return App;
}(React.Component);

var HeaderPanel = function (_React$Component2) {
    _inherits(HeaderPanel, _React$Component2);

    function HeaderPanel() {
        _classCallCheck(this, HeaderPanel);

        return _possibleConstructorReturn(this, (HeaderPanel.__proto__ || Object.getPrototypeOf(HeaderPanel)).apply(this, arguments));
    }

    _createClass(HeaderPanel, [{
        key: 'render',
        value: function render() {
            return React.createElement(
                'div',
                { id: 'header-panel' },
                React.createElement('img', { id: 'logo', src: 'images/active_learning_logo_white.png', width: '175', height: '75', alt: 'logo' }),
                React.createElement(
                    'h2',
                    { id: 'name' },
                    this.props.user ? this.props.user.username : ''
                ),
                React.createElement(
                    'nav',
                    null,
                    React.createElement(
                        'form',
                        { method: 'post' },
                        React.createElement(
                            'button',
                            { className: 'header-nav-link', formAction: 'api/logout' },
                            'Logout'
                        )
                    ),
                    React.createElement(
                        IndexLink,
                        { to: '/active-learning/statistics', className: 'header-nav-link', activeClassName: 'selected' },
                        'Statistics'
                    ),
                    React.createElement(
                        IndexLink,
                        { to: '/active-learning/', className: 'header-nav-link', activeClassName: 'selected' },
                        'Home'
                    )
                )
            );
        }
    }]);

    return HeaderPanel;
}(React.Component);

var LiveQuizPanel = function (_React$Component3) {
    _inherits(LiveQuizPanel, _React$Component3);

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

var ConfirmBox = function (_React$Component4) {
    _inherits(ConfirmBox, _React$Component4);

    function ConfirmBox() {
        _classCallCheck(this, ConfirmBox);

        return _possibleConstructorReturn(this, (ConfirmBox.__proto__ || Object.getPrototypeOf(ConfirmBox)).apply(this, arguments));
    }

    _createClass(ConfirmBox, [{
        key: 'clicked',
        value: function clicked(value) {
            this.props.hideConfirm();
            this.props.onAction && this.props.onAction(value);
        }
    }, {
        key: 'render',
        value: function render() {
            var _this6 = this;

            return React.createElement(
                'div',
                { id: 'confirm-box' },
                React.createElement(
                    'p',
                    { id: 'confirm-msg' },
                    this.props.title
                ),
                this.props.type == 'yesno' ? React.createElement(
                    'div',
                    null,
                    React.createElement(
                        'button',
                        {
                            onClick: function onClick() {
                                return _this6.clicked(false);
                            },
                            className: 'cancel-button' },
                        this.props.noText || 'No'
                    ),
                    React.createElement(
                        'button',
                        {
                            onClick: function onClick() {
                                return _this6.clicked(true);
                            },
                            className: 'confirm-button' },
                        this.props.yesText || 'Yes'
                    )
                ) : React.createElement(
                    'button',
                    { onClick: function onClick() {
                            return _this6.clicked();
                        }, id: 'ok-button' },
                    this.props.okText || 'Ok'
                )
            );
        }
    }]);

    return ConfirmBox;
}(React.Component);

var Panels = function (_React$Component5) {
    _inherits(Panels, _React$Component5);

    function Panels(props) {
        _classCallCheck(this, Panels);

        var _this7 = _possibleConstructorReturn(this, (Panels.__proto__ || Object.getPrototypeOf(Panels)).call(this, props));

        _this7.state = {
            questions: {},
            quizzes: {},
            selectedQuiz: null
        };

        socket.on('questions', function (data) {
            return _this7.setState({ questions: data });
        });
        socket.on('quizzes', function (data) {
            return _this7.setState({ quizzes: data });
        });

        _this7.refresh = _this7.refresh.bind(_this7);

        if (socket.isLoggedIn()) {
            _this7.refresh();
        } else {
            socket.on('login', _this7.refresh);
        }
        return _this7;
    }

    _createClass(Panels, [{
        key: 'refresh',
        value: function refresh() {
            socket.send('get_quizzes', function (err, data) {
                return !err && socket.emit('quizzes', data);
            });
            socket.send('get_questions', function (err, data) {
                return !err && socket.emit('questions', data);
            });
            socket.send('get_live_question', function (err, data) {
                return !err && socket.emit('live_question', data);
            });
        }
    }, {
        key: 'componentWillUnmount',
        value: function componentWillUnmount() {
            socket.remove('login', this.refresh);
        }
    }, {
        key: 'chooseQuiz',
        value: function chooseQuiz(id) {
            var _this8 = this;

            if (!id || !this.state.selectedQuiz) {
                this.setState({ selectedQuiz: id });
            } else {
                this.props.showConfirm({
                    type: 'yesno',
                    title: 'Discard current quiz?',
                    onAction: function onAction(confirm) {
                        if (confirm) {
                            _this8.setState({ selectedQuiz: id });
                        }
                    }
                });
            }
        }
    }, {
        key: 'render',
        value: function render() {
            var _this9 = this;

            return React.createElement(
                'div',
                null,
                React.createElement(QuizPanel, {
                    showConfirm: this.props.showConfirm,
                    quizzes: this.state.quizzes,
                    chooseQuiz: this.chooseQuiz.bind(this),
                    toggleLiveQuiz: this.props.toggleLiveQuiz }),
                React.createElement(QuestionPanel, {
                    showConfirm: this.props.showConfirm,
                    hideQuiz: function hideQuiz() {
                        return _this9.chooseQuiz(null);
                    },
                    questions: this.state.questions,
                    quiz: this.state.selectedQuiz && this.state.quizzes[this.state.selectedQuiz] })
            );
        }
    }]);

    return Panels;
}(React.Component);

var QuizPanel = function (_React$Component6) {
    _inherits(QuizPanel, _React$Component6);

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

var QuizList = function (_React$Component7) {
    _inherits(QuizList, _React$Component7);

    function QuizList() {
        _classCallCheck(this, QuizList);

        return _possibleConstructorReturn(this, (QuizList.__proto__ || Object.getPrototypeOf(QuizList)).apply(this, arguments));
    }

    _createClass(QuizList, [{
        key: 'render',
        value: function render() {
            var _this12 = this;

            return React.createElement(
                'ol',
                { className: 'quiz-list' },
                Object.keys(this.props.quizzes).map(function (id) {
                    var quiz = _this12.props.quizzes[id];
                    var chooseQuizId = _this12.props.chooseQuiz.bind(null, id);
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

var QuestionPanel = function (_React$Component8) {
    _inherits(QuestionPanel, _React$Component8);

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
                this.props.quiz ? React.createElement(QuestionList, {
                    quiz: this.props.quiz,
                    questions: this.props.questions,
                    showConfirm: this.props.showConfirm,
                    hideQuiz: this.props.hideQuiz }) : React.createElement(
                    'p',
                    { id: 'choose-quiz-msg' },
                    'Choose a quiz from the left side!'
                )
            );
        }
    }]);

    return QuestionPanel;
}(React.Component);

var QuestionList = function (_React$Component9) {
    _inherits(QuestionList, _React$Component9);

    function QuestionList(props) {
        _classCallCheck(this, QuestionList);

        var _this14 = _possibleConstructorReturn(this, (QuestionList.__proto__ || Object.getPrototypeOf(QuestionList)).call(this, props));

        _this14.answers = {};
        return _this14;
    }

    _createClass(QuestionList, [{
        key: 'answerSelected',
        value: function answerSelected(id, value) {
            this.answers[id] = value;
        }
    }, {
        key: 'submitClicked',
        value: function submitClicked() {
            var _this15 = this;

            var title = 'Are you sure you want to submit this quiz?';
            var answersLen = Object.keys(this.answers).length;
            var questionsLen = this.props.quiz.questions.length;
            if (answersLen != questionsLen) {
                title += ' You only answered ' + answersLen + ' of the ' + questionsLen + ' questions.';
            }

            this.props.showConfirm({
                type: 'yesno',
                title: title,
                onAction: function onAction(confirm) {
                    if (confirm) {
                        socket.send('submit_quiz', { quiz_id: _this15.props.quiz.id, answers: _this15.answers }, function (err, data) {
                            _this15.props.showConfirm({
                                type: 'ok',
                                title: err ? 'Failed to submit, please trying again. Error: ' + err : 'Your answers have been submitted.'
                            });

                            _this15.props.hideQuiz();
                        });
                    }
                }
            });
        }
    }, {
        key: 'render',
        value: function render() {
            var _this16 = this;

            return React.createElement(
                'div',
                null,
                React.createElement(
                    'ol',
                    { id: 'question-list' },
                    this.props.quiz.questions.map(function (question_id) {
                        return React.createElement(Question, {
                            key: question_id,
                            question: _this16.props.questions[question_id],
                            answerSelected: _this16.answerSelected.bind(_this16, question_id) });
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

var Question = function (_React$Component10) {
    _inherits(Question, _React$Component10);

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
            var _this18 = this;

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
                                    name: 'answers-' + _this18.props.question.id,
                                    value: idx,
                                    onChange: _this18.answerSelected.bind(_this18) }),
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