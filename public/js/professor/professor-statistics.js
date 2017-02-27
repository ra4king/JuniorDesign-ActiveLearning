'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/* JSON Object I want
statistics = {
    ...
    'username': {
        ...
        'quiz_id': {
            name,
            questions: {
                'questions_id': {
                    name,
                    answer,
                    score,
                    total
                },
            },
        },
    },
}
*/

var StatisticsPanels = function (_React$Component) {
    _inherits(StatisticsPanels, _React$Component);

    function StatisticsPanels(props) {
        _classCallCheck(this, StatisticsPanels);

        var _this = _possibleConstructorReturn(this, (StatisticsPanels.__proto__ || Object.getPrototypeOf(StatisticsPanels)).call(this, props));

        _this.state = {
            statistics: {},
            showAllStudents: true
        };

        if (socket.isLoggedIn()) {
            _this.getStats();
        } else {
            socket.on('login', _this.getStats.bind(_this));
        }
        return _this;
    }

    _createClass(StatisticsPanels, [{
        key: 'getStats',
        value: function getStats() {
            var _this2 = this;

            socket.send('get_stats', function (err, stats) {
                if (err) {
                    console.error('Error getting stats: ' + err);
                } else {
                    _this2.setState({ statistics: stats });
                }
            });
        }
    }, {
        key: 'showStudentStats',
        value: function showStudentStats(studentName) {
            this.setState({
                showStudent: studentName,
                showQuiz: null,
                showAllQuizzes: false,
                showAllStudents: false
            });
        }
    }, {
        key: 'showQuizStats',
        value: function showQuizStats(quizName) {
            this.setState({
                showStudent: null,
                showQuiz: quizName,
                showAllQuizzes: false,
                showAllStudents: false
            });
        }
    }, {
        key: 'showAllQuizStats',
        value: function showAllQuizStats() {
            this.setState({
                showStudent: null,
                showQuiz: null,
                showAllQuizzes: true,
                showAllStudents: false
            });
        }
    }, {
        key: 'showAllStudentStats',
        value: function showAllStudentStats() {
            this.setState({
                showStudent: null,
                showQuiz: null,
                showAllQuizzes: false,
                showAllStudents: true
            });
        }
    }, {
        key: 'render',
        value: function render() {
            return React.createElement(
                'div',
                null,
                React.createElement(SidePanel, {
                    showStudentStats: this.showStudentStats.bind(this),
                    showQuizStats: this.showQuizStats.bind(this),
                    showAllQuizStats: this.showAllQuizStats.bind(this),
                    showAllStudentStats: this.showAllStudentStats.bind(this),
                    statistics: this.state.statistics }),
                React.createElement(GraphPanel, {
                    showStudent: this.state.showStudent,
                    showQuiz: this.state.showQuiz,
                    showAllQuizzes: this.state.showAllQuizzes,
                    showAllStudents: this.state.showAllStudents,
                    statistics: this.state.statistics })
            );
        }
    }]);

    return StatisticsPanels;
}(React.Component);

var SidePanel = function (_React$Component2) {
    _inherits(SidePanel, _React$Component2);

    function SidePanel(props) {
        _classCallCheck(this, SidePanel);

        var _this3 = _possibleConstructorReturn(this, (SidePanel.__proto__ || Object.getPrototypeOf(SidePanel)).call(this, props));

        _this3.state = {
            showStudents: true
        };
        return _this3;
    }

    _createClass(SidePanel, [{
        key: 'showStudents',
        value: function showStudents() {
            this.setState({ showStudents: true });
            this.props.showAllStudentStats();
        }
    }, {
        key: 'showQuizzes',
        value: function showQuizzes() {
            this.setState({ showStudents: false });
            this.props.showAllQuizStats();
        }
    }, {
        key: 'getAllQuizNames',
        value: function getAllQuizNames() {
            var statistics = this.props.statistics;

            var quizNames = [];
            for (var username in statistics) {
                for (var quiz_id in statistics[username]) {
                    var quizName = statistics[username][quiz_id].name;
                    if (quizNames.indexOf(quizName) == -1) {
                        quizNames.push(quizName);
                    }
                }
            }

            return quizNames;
        }
    }, {
        key: 'render',
        value: function render() {
            var _this4 = this;

            return React.createElement(
                'div',
                { className: 'panel', id: 'student-panel' },
                React.createElement(
                    'ul',
                    { className: 'tab' },
                    React.createElement(
                        'li',
                        null,
                        React.createElement(
                            'a',
                            { href: '#', className: 'tablinks' + (this.state.showStudents ? ' active' : ''), onClick: this.showStudents.bind(this) },
                            'Students'
                        )
                    ),
                    React.createElement(
                        'li',
                        null,
                        React.createElement(
                            'a',
                            { href: '#', className: 'tablinks' + (this.state.showStudents ? '' : ' active'), onClick: this.showQuizzes.bind(this) },
                            'Quizzes'
                        )
                    )
                ),
                this.state.showStudents ? React.createElement(
                    'table',
                    { className: 'sortable tabcontent', id: 'student-list' },
                    React.createElement(
                        'thead',
                        null,
                        React.createElement(
                            'tr',
                            null,
                            React.createElement(
                                'th',
                                null,
                                'Students'
                            )
                        )
                    ),
                    React.createElement(
                        'tbody',
                        { id: 'student-buttons' },
                        Object.keys(this.props.statistics).map(function (studentName) {
                            return React.createElement(
                                'tr',
                                { key: studentName },
                                React.createElement(
                                    'td',
                                    null,
                                    React.createElement(
                                        'button',
                                        { className: 'list-button', onClick: function onClick() {
                                                return _this4.props.showStudentStats(studentName);
                                            } },
                                        studentName
                                    )
                                )
                            );
                        })
                    )
                ) : React.createElement(
                    'table',
                    { className: 'sortable tabcontent', id: 'quiz-list' },
                    React.createElement(
                        'thead',
                        null,
                        React.createElement(
                            'tr',
                            null,
                            React.createElement(
                                'th',
                                null,
                                'Quizzes'
                            )
                        )
                    ),
                    React.createElement(
                        'tbody',
                        { id: 'quiz-buttons' },
                        this.getAllQuizNames().map(function (quizName, idx) {
                            return React.createElement(
                                'tr',
                                { key: idx + '-' + quizName },
                                React.createElement(
                                    'td',
                                    null,
                                    React.createElement(
                                        'button',
                                        { className: 'list-button', onClick: function onClick() {
                                                return _this4.props.showQuizStats(quizName);
                                            } },
                                        quizName
                                    )
                                )
                            );
                        })
                    )
                )
            );
        }
    }]);

    return SidePanel;
}(React.Component);

var GraphPanel = function (_React$Component3) {
    _inherits(GraphPanel, _React$Component3);

    function GraphPanel() {
        _classCallCheck(this, GraphPanel);

        return _possibleConstructorReturn(this, (GraphPanel.__proto__ || Object.getPrototypeOf(GraphPanel)).apply(this, arguments));
    }

    _createClass(GraphPanel, [{
        key: 'createChart',
        value: function createChart(info, displayX) {
            return new Chart(document.getElementById('statistics-chart'), {
                type: 'bar',
                data: info,
                options: {
                    maintainAspectRatio: false,
                    scales: {
                        yAxes: [{
                            ticks: {
                                beginAtZero: true,
                                max: 100
                            }
                        }],
                        xAxes: [{
                            display: displayX
                        }]
                    }
                }
            });
        }
    }, {
        key: 'displayStudentStatistics',
        value: function displayStudentStatistics(username) {
            var statistics = this.props.statistics;

            var quizNames = [];
            var quizScores = [];

            for (var quiz_id in statistics[username]) {
                var score = 0;
                var total = 0;
                for (var question_id in statistics[username][quiz_id]['questions']) {
                    var question = statistics[username][quiz_id]['questions'][question_id];
                    score += question['score'];
                    total += question['total'];
                }
                quizNames.push(unescapeHTML(statistics[username][quiz_id]['name']));
                quizScores.push(100.0 * (score / total));
            }

            var info = {
                labels: quizNames,
                datasets: [{
                    label: '% correct answers',
                    data: quizScores,
                    backgroundColor: 'rgba(100, 129, 237, 0.5)',
                    borderColor: 'rgba(200, 200, 200, 1)',
                    borderWidth: 2
                }]
            };

            if (this.chart) {
                this.chart.destroy();
            }
            this.chart = this.createChart(info, true);
        }
    }, {
        key: 'displayQuizStatistics',
        value: function displayQuizStatistics(name) {
            var statistics = this.props.statistics;

            var questions = {};
            for (var username in statistics) {
                for (var quiz_id in statistics[username]) {
                    if (statistics[username][quiz_id]['name'] == name) {
                        for (var question_id in statistics[username][quiz_id]['questions']) {
                            var prevScore = 0;
                            var prevTotal = 0;
                            var prevA = 0;
                            var prevB = 0;
                            var prevC = 0;
                            var prevD = 0;
                            var question_name = statistics[username][quiz_id]['questions'][question_id]['name'];
                            var question = statistics[username][quiz_id]['questions'][question_id];
                            if (questions[question_name] != null) {
                                prevScore = questions[question_name]['score'];
                                prevTotal = questions[question_name]['total'];
                                prevA = questions[question_name]['A'];
                                prevB = questions[question_name]['B'];
                                prevC = questions[question_name]['C'];
                                prevD = questions[question_name]['D'];
                            }
                            if (question['answer'] == 0) {
                                prevA += question['total'];
                            }
                            if (question['answer'] == 1) {
                                prevB += question['total'];
                            }
                            if (question['answer'] == 2) {
                                prevC += question['total'];
                            }
                            if (question['answer'] == 3) {
                                prevD += question['total'];
                            }
                            questions[question_name] = {
                                score: prevScore + question['score'],
                                total: prevTotal + question['total'],
                                A: prevA,
                                B: prevB,
                                C: prevC,
                                D: prevD
                            };
                        }
                    }
                }
            }
            var labels = [];
            var data = [];
            for (question in questions) {
                var str = unescapeHTML(question);
                var perA = (100 * (questions[question]['A'] / questions[question]['total'])).toFixed(2);
                var perB = (100 * (questions[question]['B'] / questions[question]['total'])).toFixed(2);
                var perC = (100 * (questions[question]['C'] / questions[question]['total'])).toFixed(2);
                var perD = (100 * (questions[question]['D'] / questions[question]['total'])).toFixed(2);
                if (perA > 0) {
                    str += " A: " + perA + "%";
                }
                if (perB > 0) {
                    str += " B: " + perB + "%";
                }
                if (perC > 0) {
                    str += " C: " + perC + "%";
                }
                if (perD > 0) {
                    str += " D: " + perD + "%";
                }
                labels.push(str);
                data.push(100.0 * (questions[question]['score'] / questions[question]['total']));
            }

            var info = {
                labels: labels,
                datasets: [{
                    label: '% correct answers',
                    data: data,
                    backgroundColor: 'rgba(100, 129, 237, 0.5)',
                    borderColor: 'rgba(200, 200, 200, 1)',
                    borderWidth: 2
                }]
            };

            if (this.chart) {
                this.chart.destroy();
            }
            this.chart = this.createChart(info, false);
        }
    }, {
        key: 'displayAllQuizStatistics',
        value: function displayAllQuizStatistics() {
            var statistics = this.props.statistics;

            var quizzes = {};

            for (var username in statistics) {
                for (var quiz_id in statistics[username]) {
                    var quizName = statistics[username][quiz_id]['name'];
                    var score = 0;
                    var total = 0;
                    for (var question_id in statistics[username][quiz_id]['questions']) {
                        var question = statistics[username][quiz_id]['questions'][question_id];
                        score += question['score'];
                        total += question['total'];
                    }
                    if (quizzes[quizName] != null) {
                        quizzes[quizName]['score'] += score;
                        quizzes[quizName]['total'] += total;
                    } else {
                        quizzes[quizName] = { score: score, total: total };
                    }
                }
            }
            var labels = [];
            var data = [];
            for (var quizName in quizzes) {
                labels.push(unescapeHTML(quizName));
                data.push(100.0 * (quizzes[quizName]['score'] / quizzes[quizName]['total']));
            }
            var info = {
                labels: labels,
                datasets: [{
                    label: '% correct answers',
                    data: data,
                    backgroundColor: 'rgba(100, 129, 237, 0.5)',
                    borderColor: 'rgba(200, 200, 200, 1)',
                    borderWidth: 2
                }]
            };

            if (this.chart) {
                this.chart.destroy();
            }
            this.chart = this.createChart(info, true);
        }
    }, {
        key: 'displayAllStudentStatistics',
        value: function displayAllStudentStatistics() {
            var statistics = this.props.statistics;

            var usernames = [];
            var scores = [];

            for (var username in statistics) {
                var grade = 0;
                var count = 0;
                for (var quiz_id in statistics[username]) {
                    var score = 0;
                    var total = 0;
                    for (var question_id in statistics[username][quiz_id]['questions']) {
                        var question = statistics[username][quiz_id]['questions'][question_id];
                        score += question['score'];
                        total += question['total'];
                    }
                    grade += 100.0 * (score / total);
                    count++;
                }

                usernames.push(unescapeHTML(username));
                scores.push(grade /= count);
            }

            var info = {
                labels: usernames,
                datasets: [{
                    label: '% grade overall',
                    data: scores,
                    backgroundColor: 'rgba(100, 129, 237, 0.5)',
                    borderColor: 'rgba(200, 200, 200, 1)',
                    borderWidth: 2
                }]
            };

            if (this.chart) {
                this.chart.destroy();
            }
            this.chart = this.createChart(info, true);
        }
    }, {
        key: 'setupChart',
        value: function setupChart(canvas) {
            this.canvas = this.canvas || canvas;

            if (this.props.showStudent) {
                this.displayStudentStatistics(this.props.showStudent);
            } else if (this.props.showQuiz) {
                this.displayQuizStatistics(this.props.showQuiz);
            } else if (this.props.showAllQuizzes) {
                this.displayAllQuizStatistics();
            } else {
                this.displayAllStudentStatistics();
            }
        }
    }, {
        key: 'render',
        value: function render() {
            return React.createElement(
                'div',
                { id: 'statistics-panel' },
                React.createElement('canvas', { ref: this.setupChart.bind(this), id: 'statistics-chart' })
            );
        }
    }]);

    return GraphPanel;
}(React.Component);