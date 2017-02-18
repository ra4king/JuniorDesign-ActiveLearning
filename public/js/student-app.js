'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var QuestionList = function (_React$Component) {
    _inherits(QuestionList, _React$Component);

    function QuestionList(props) {
        _classCallCheck(this, QuestionList);

        return _possibleConstructorReturn(this, (QuestionList.__proto__ || Object.getPrototypeOf(QuestionList)).call(this, props));

        //this.markAnswer = this.markAnswer.bind(this);
    }

    _createClass(QuestionList, [{
        key: 'render',
        value: function render() {
            return React.createElement(
                'ol',
                null,
                this.props.quiz.questions.map(function (question_id) {
                    return React.createElement(Question, { key: question_id, id: question_id });
                }, this)
            );
        }
    }]);

    return QuestionList;
}(React.Component);

var Question = function (_React$Component2) {
    _inherits(Question, _React$Component2);

    function Question() {
        _classCallCheck(this, Question);

        return _possibleConstructorReturn(this, (Question.__proto__ || Object.getPrototypeOf(Question)).apply(this, arguments));
    }

    _createClass(Question, [{
        key: 'render',
        value: function render() {
            var question = questions[this.props.id];

            return React.createElement(
                'li',
                { id: 'question-' + this.props.id, className: 'question' },
                React.createElement(
                    'div',
                    { className: 'question-body', style: question.image ? { width: '70%' } : {} },
                    React.createElement(
                        'p',
                        { className: 'question-name' },
                        unescapeHTML(question.name)
                    ),
                    React.createElement(
                        'ol',
                        { className: 'answer-list' },
                        question.answers.map(function (answer, idx) {
                            return React.createElement(
                                'li',
                                { key: idx, className: 'answer' },
                                React.createElement('input', { type: 'radio', name: 'answers-' + this.props.id }),
                                unescapeHTML(answer)
                            );
                        }, this)
                    )
                ),
                React.createElement('img', { className: 'question-image', src: question.image || null })
            );
        }
    }]);

    return Question;
}(React.Component);

function chooseQuiz(id) {
    current_quiz_id = id;

    var quiz = quizzes[id];

    $('#choose-quiz-msg').css('display', 'none');
    $('#question-list').css('text-align', 'left');
    $('#quiz-title').html(quiz.name);
    $('#submit-all').css('display', 'block');

    ReactDOM.render(React.createElement(QuestionList, { quiz: quiz }), document.getElementById('questions-root'));
}

var QuizList = function (_React$Component3) {
    _inherits(QuizList, _React$Component3);

    function QuizList() {
        _classCallCheck(this, QuizList);

        return _possibleConstructorReturn(this, (QuizList.__proto__ || Object.getPrototypeOf(QuizList)).apply(this, arguments));
    }

    _createClass(QuizList, [{
        key: 'render',
        value: function render() {
            return React.createElement(
                'ol',
                { id: 'quiz-list' },
                Object.keys(quizzes).map(function (id) {
                    var quiz = quizzes[id];
                    var chooseQuizId = chooseQuiz.bind(null, id);
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

function updateQuizzes() {
    ReactDOM.render(React.createElement(QuizList, null), document.getElementById('quizzes-root'));
}