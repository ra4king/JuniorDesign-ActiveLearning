'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

window.onload = function () {
    socket.on('login', function (success) {
        if (success) {
            socket.send('get_quizzes', function (err, data) {
                return !err && socket.emit('quizzes', data);
            });
            socket.send('get_questions', function (err, data) {
                return !err && socket.emit('questions', data);
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
            showConfirm: null,
            currentLiveQuiz: null
        };

        socket.on('questions', function (data) {
            return _this.setState({ questions: data });
        });
        socket.on('quizzes', function (data) {
            return _this.setState({ quizzes: data });
        });
        return _this;
    }

    _createClass(Panels, [{
        key: 'presentLive',
        value: function presentLive(quizId) {
            this.setState({ currentLiveQuiz: this.state.quizzes[quizId] });
        }
    }, {
        key: 'hideLiveQuiz',
        value: function hideLiveQuiz() {
            this.setState({ currentLiveQuiz: null });
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
                (this.state.currentLiveQuiz || this.state.showConfirm) && React.createElement('div', { id: 'overlay' }),
                this.state.currentLiveQuiz && React.createElement(LiveQuizPanel, {
                    quiz: this.state.currentLiveQuiz,
                    questions: this.state.questions,
                    hideLiveQuiz: this.hideLiveQuiz.bind(this) }),
                this.state.showConfirm && React.createElement(ConfirmBox, _extends({ hide: function hide() {
                        return _this2.hideConfirm();
                    } }, this.state.showConfirm)),
                React.createElement(
                    'div',
                    { className: (this.state.currentLiveQuiz || this.state.showConfirm) && 'blur' },
                    React.createElement(HeaderPanel, null),
                    React.createElement(QuizPanel, {
                        showConfirm: this.showConfirm.bind(this),
                        questions: this.state.questions,
                        quizzes: this.state.quizzes,
                        presentLive: this.presentLive.bind(this) }),
                    React.createElement(QuestionPanel, {
                        showConfirm: this.showConfirm.bind(this),
                        questions: this.state.questions })
                )
            );
        }
    }]);

    return Panels;
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
                    username
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
                        'a',
                        { href: 'settings', className: 'header-nav-link' },
                        'Settings'
                    ),
                    React.createElement(
                        'a',
                        { href: 'statistics', className: 'header-nav-link' },
                        'Statistics'
                    ),
                    React.createElement(
                        'a',
                        { href: './', className: 'header-nav-link', id: 'selected' },
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

    function LiveQuizPanel(props) {
        _classCallCheck(this, LiveQuizPanel);

        var _this4 = _possibleConstructorReturn(this, (LiveQuizPanel.__proto__ || Object.getPrototypeOf(LiveQuizPanel)).call(this, props));

        _this4.state = {
            currentLiveQuestion: null,
            onLoginFunc: function onLoginFunc(success) {
                if (_this4.state.currentLiveQuestion != null) socket.send('broadcast_live_question', _this4.state.currentLiveQuestion);
            }
        };

        socket.on('login', _this4.state.onLoginFunc);
        return _this4;
    }

    _createClass(LiveQuizPanel, [{
        key: 'componentWillUnmount',
        value: function componentWillUnmount() {
            socket.remove('login', this.state.onLoginFunc);
            socket.send('end_live_question');
        }
    }, {
        key: 'presentLiveQuestion',
        value: function presentLiveQuestion(id) {
            this.setState({ currentLiveQuestion: id });
            socket.send('broadcast_live_question', id);
        }
    }, {
        key: 'render',
        value: function render() {
            var _this5 = this;

            return React.createElement(
                'div',
                { id: 'live-quiz' },
                React.createElement(
                    'ol',
                    { id: 'live-questions-list' },
                    this.props.quiz.questions.map(function (id) {
                        return React.createElement(
                            Question,
                            { key: id, question: _this5.props.questions[id] },
                            React.createElement(
                                'button',
                                {
                                    className: 'presenting-live-button' + (id == _this5.state.currentLiveQuestion ? ' presenting-live-button-selected' : ''),
                                    onClick: function onClick() {
                                        return _this5.presentLiveQuestion(id);
                                    } },
                                'L'
                            )
                        );
                    })
                ),
                React.createElement(
                    'button',
                    { onClick: this.props.hideLiveQuiz, className: 'delete-button' },
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
            this.props.hide();
            this.props.onAction && this.props.onAction(value);
        }
    }, {
        key: 'render',
        value: function render() {
            var _this7 = this;

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
                        { onClick: function onClick() {
                                return _this7.clicked(false);
                            }, className: 'cancel-button' },
                        this.props.noText || 'No'
                    ),
                    React.createElement(
                        'button',
                        { onClick: function onClick() {
                                return _this7.clicked(true);
                            }, className: 'confirm-button' },
                        this.props.yesText || 'Yes'
                    )
                ) : React.createElement(
                    'button',
                    { onClick: function onClick() {
                            return _this7.clicked();
                        }, id: 'ok-button' },
                    this.props.okText || 'Ok'
                )
            );
        }
    }]);

    return ConfirmBox;
}(React.Component);

var QuizPanel = function (_React$Component5) {
    _inherits(QuizPanel, _React$Component5);

    function QuizPanel(props) {
        _classCallCheck(this, QuizPanel);

        var _this8 = _possibleConstructorReturn(this, (QuizPanel.__proto__ || Object.getPrototypeOf(QuizPanel)).call(this, props));

        _this8.state = {
            editQuiz: null
        };
        return _this8;
    }

    _createClass(QuizPanel, [{
        key: 'chooseQuiz',
        value: function chooseQuiz(id) {
            this.setState({ editQuiz: this.props.quizzes[id] });
        }
    }, {
        key: 'toggleQuizEditor',
        value: function toggleQuizEditor() {
            this.setState(function (prevState) {
                return { editQuiz: prevState.editQuiz ? null : {} };
            });
        }
    }, {
        key: 'hideQuizEditor',
        value: function hideQuizEditor() {
            this.setState({ editQuiz: null });
        }
    }, {
        key: 'render',
        value: function render() {
            var _this9 = this;

            return React.createElement(
                'div',
                { id: 'quiz-panel' },
                React.createElement(
                    'button',
                    { className: 'option-button', onClick: function onClick() {
                            return _this9.toggleQuizEditor();
                        } },
                    this.state.editQuiz ? 'Cancel' : 'Create Quiz'
                ),
                this.state.editQuiz ? React.createElement(QuizEditor, {
                    quiz: this.state.editQuiz,
                    questions: this.props.questions,
                    hideQuizEditor: this.hideQuizEditor.bind(this),
                    showConfirm: this.props.showConfirm }) : React.createElement(QuizList, {
                    showConfirm: this.props.showConfirm,
                    quizzes: this.props.quizzes,
                    chooseQuiz: this.chooseQuiz.bind(this),
                    presentLive: this.props.presentLive })
            );
        }
    }]);

    return QuizPanel;
}(React.Component);

var QuizEditor = function (_React$Component6) {
    _inherits(QuizEditor, _React$Component6);

    function QuizEditor(props) {
        _classCallCheck(this, QuizEditor);

        var _this10 = _possibleConstructorReturn(this, (QuizEditor.__proto__ || Object.getPrototypeOf(QuizEditor)).call(this, props));

        _this10.state = {
            id: props.quiz.id,
            name: props.quiz.name || '',
            questions: props.quiz.questions || []
        };

        _this10.questionsDOM = {};
        return _this10;
    }

    _createClass(QuizEditor, [{
        key: 'onNameChange',
        value: function onNameChange(e) {
            this.setState({ name: e.target.value });
        }
    }, {
        key: 'submitQuiz',
        value: function submitQuiz() {
            var _this11 = this;

            var callback = function callback(err) {
                if (err) {
                    _this11.props.showConfirm({
                        type: 'ok',
                        title: err
                    });
                } else {
                    _this11.props.hideQuizEditor();
                }
            };

            if (this.state.id) {
                socket.send('update_quiz', { id: this.state.id, name: this.state.name, questions: this.state.questions }, callback);
            } else {
                socket.send('create_quiz', { name: this.state.name, questions: this.state.questions }, callback);
            }
        }
    }, {
        key: 'removeQuestion',
        value: function removeQuestion(id) {
            this.setState(function (prevState) {
                var questions = prevState.questions.slice();
                var idx = questions.indexOf(id);
                if (idx != -1) {
                    questions.splice(idx, 1);
                    return { questions: questions };
                } else {
                    return {};
                }
            });
        }
    }, {
        key: 'onDragStart',
        value: function onDragStart(id, e) {
            e.dataTransfer.setData('question-id', id);
        }
    }, {
        key: 'getDropTargetId',
        value: function getDropTargetId(e) {
            var component = e.target;
            while (component && (!component.dataset || !component.dataset.id)) {
                component = component.parentNode;
            }
            return component && component.dataset.id;
        }
    }, {
        key: 'onDrop',
        value: function onDrop(e) {
            this.setState({ dragOver: null });

            e.preventDefault();
            var id = e.dataTransfer.getData('question-id');

            if (id) {
                var dropTargetId = this.getDropTargetId(e);

                this.setState(function (prevState) {
                    var questions = prevState.questions.slice();

                    if (dropTargetId) {
                        // nested if to skip the else in case this is false
                        if (id != dropTargetId) {
                            var idx = questions.indexOf(id);
                            var dropIdx = questions.indexOf(dropTargetId);

                            if (idx != -1) {
                                questions.splice(idx, 1);
                            }

                            if (dropIdx != -1) {
                                questions.splice(dropIdx, 0, id);
                            } else {
                                questions.push(id);
                            }
                        }
                    } else {
                        var idx = questions.indexOf(id);
                        if (idx != -1) {
                            questions.splice(idx, 1);
                        }

                        questions.push(id);
                    }

                    return { questions: questions };
                });
            }
        }
    }, {
        key: 'onDragOver',
        value: function onDragOver(e) {
            e.preventDefault();

            var dragOverId = this.getDropTargetId(e);

            if (dragOverId != this.state.dragOver) {
                this.setState({ dragOver: dragOverId });
            }
        }
    }, {
        key: 'render',
        value: function render() {
            var _this12 = this;

            return React.createElement(
                'div',
                { id: 'quiz-creator' },
                React.createElement(
                    'div',
                    { id: 'quiz-creator-header' },
                    React.createElement(
                        'div',
                        { id: 'quiz-name' },
                        'Name: ',
                        React.createElement('input', { type: 'text', id: 'quiz-name-field', value: this.state.name, onChange: this.onNameChange.bind(this) })
                    ),
                    React.createElement(
                        'div',
                        { id: 'submit-quiz' },
                        React.createElement(
                            'button',
                            { id: 'submit-quiz-button', onClick: this.submitQuiz.bind(this) },
                            this.state.id ? 'Update' : 'Submit'
                        )
                    )
                ),
                React.createElement(
                    'ol',
                    { id: 'quiz-question-list', onDrop: this.onDrop.bind(this), onDragOver: this.onDragOver.bind(this) },
                    this.state.questions.length > 0 ? [this.state.questions.map(function (id) {
                        return React.createElement(
                            Question,
                            { key: id,
                                question: _this12.props.questions[id],
                                draggable: true,
                                onDragStart: _this12.onDragStart.bind(_this12, id),
                                draggedOver: _this12.state.dragOver == id },
                            React.createElement(
                                'button',
                                { className: 'delete-button', onClick: function onClick() {
                                        return _this12.removeQuestion(id);
                                    } },
                                '\u2716'
                            )
                        );
                    }), React.createElement('li', { style: { visibility: 'hidden', height: '100px' } })] : React.createElement(
                        'p',
                        { style: { textAlign: 'center' } },
                        'Drag questions here!'
                    )
                )
            );
        }
    }]);

    return QuizEditor;
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
            var _this14 = this;

            return React.createElement(
                'ol',
                { className: 'quiz-list' },
                Object.keys(this.props.quizzes).map(function (id) {
                    var quiz = _this14.props.quizzes[id];
                    return React.createElement(Quiz, { key: id,
                        quiz: quiz,
                        chooseQuiz: function chooseQuiz() {
                            return _this14.props.chooseQuiz(id);
                        },
                        presentLive: function presentLive() {
                            return _this14.props.presentLive(id);
                        },
                        showConfirm: _this14.props.showConfirm });
                })
            );
        }
    }]);

    return QuizList;
}(React.Component);

var Quiz = function (_React$Component8) {
    _inherits(Quiz, _React$Component8);

    function Quiz() {
        _classCallCheck(this, Quiz);

        return _possibleConstructorReturn(this, (Quiz.__proto__ || Object.getPrototypeOf(Quiz)).apply(this, arguments));
    }

    _createClass(Quiz, [{
        key: 'deleteQuiz',
        value: function deleteQuiz() {
            var _this16 = this;

            this.props.showConfirm({
                type: 'yesno',
                title: 'Are you sure you want to delete this quiz?',
                onAction: function onAction(choice) {
                    if (choice) {
                        socket.send('delete_quiz', _this16.props.quiz.id, function (err, data) {
                            _this16.props.showConfirm({
                                type: 'ok',
                                title: err || 'Quiz deleted'
                            });
                        });
                    }
                } });
        }
    }, {
        key: 'render',
        value: function render() {
            return React.createElement(
                'li',
                { className: 'quiz' },
                React.createElement(
                    'button',
                    { className: 'quiz-body', onClick: this.props.chooseQuiz },
                    unescapeHTML(this.props.quiz.name)
                ),
                React.createElement(
                    'button',
                    { className: 'delete-button', onClick: this.deleteQuiz.bind(this) },
                    '\u2716'
                ),
                React.createElement(
                    'button',
                    { className: 'live-button', onClick: this.props.presentLive },
                    'L'
                )
            );
        }
    }]);

    return Quiz;
}(React.Component);

var QuestionPanel = function (_React$Component9) {
    _inherits(QuestionPanel, _React$Component9);

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
                React.createElement(QuestionList, { questions: this.props.questions, showConfirm: this.props.showConfirm })
            );
        }
    }]);

    return QuestionPanel;
}(React.Component);

var QuestionList = function (_React$Component10) {
    _inherits(QuestionList, _React$Component10);

    function QuestionList() {
        _classCallCheck(this, QuestionList);

        return _possibleConstructorReturn(this, (QuestionList.__proto__ || Object.getPrototypeOf(QuestionList)).apply(this, arguments));
    }

    _createClass(QuestionList, [{
        key: 'deleteQuestion',
        value: function deleteQuestion(id) {
            var _this19 = this;

            this.props.showConfirm({
                type: 'yesno',
                title: 'Are you sure you want to delete this question?',
                onAction: function onAction(choice) {
                    if (choice) {
                        socket.send('delete_question', id, function (err, data) {
                            _this19.props.showConfirm({
                                type: 'ok',
                                title: err || 'Question deleted'
                            });
                        });
                    }
                } });
        }
    }, {
        key: 'onDragStart',
        value: function onDragStart(id, e) {
            e.dataTransfer.setData('question-id', id);
        }
    }, {
        key: 'render',
        value: function render() {
            var _this20 = this;

            return React.createElement(
                'ol',
                { id: 'question-list' },
                Object.keys(this.props.questions).map(function (id) {
                    return React.createElement(
                        Question,
                        { key: id, question: _this20.props.questions[id], draggable: true, onDragStart: _this20.onDragStart.bind(_this20, id) },
                        React.createElement(
                            'button',
                            { className: 'delete-button', onClick: function onClick() {
                                    return _this20.deleteQuestion(id);
                                } },
                            '\u2716'
                        )
                    );
                })
            );
        }
    }]);

    return QuestionList;
}(React.Component);

var Question = function (_React$Component11) {
    _inherits(Question, _React$Component11);

    function Question() {
        _classCallCheck(this, Question);

        return _possibleConstructorReturn(this, (Question.__proto__ || Object.getPrototypeOf(Question)).apply(this, arguments));
    }

    _createClass(Question, [{
        key: 'render',
        value: function render() {
            var _this22 = this;

            return React.createElement(
                'li',
                { 'data-id': this.props.question.id,
                    className: 'question' + (this.props.draggable ? ' draggable' : '') + (this.props.draggedOver ? ' drag-over' : ''),
                    draggable: this.props.draggable,
                    onDragStart: this.props.onDragStart },
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
                                    value: idx,
                                    readOnly: true,
                                    checked: _this22.props.question.correct == idx }),
                                unescapeHTML(answer)
                            );
                        })
                    )
                ),
                React.createElement('img', { className: 'question-image', src: this.props.question.image || null }),
                this.props.children
            );
        }
    }]);

    return Question;
}(React.Component);