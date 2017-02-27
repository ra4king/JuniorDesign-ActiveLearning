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

        props.setPage('statistics');

        _this.state = {
            statistics: {}
        };

        socket.on('login', function (user) {
            socket.send('get_stats', function (err, stats) {
                if (err) {
                    console.error('Error getting stats: ' + err);
                } else {
                    _this.setState({ statistics: stats[user.username] });
                }
            });
        });
        return _this;
    }

    _createClass(StatisticsPanels, [{
        key: 'render',
        value: function render() {
            return React.createElement(
                'div',
                null,
                React.createElement(GraphPanel, { statistics: this.state.statistics })
            );
        }
    }]);

    return StatisticsPanels;
}(React.Component);

var GraphPanel = function (_React$Component2) {
    _inherits(GraphPanel, _React$Component2);

    function GraphPanel() {
        _classCallCheck(this, GraphPanel);

        return _possibleConstructorReturn(this, (GraphPanel.__proto__ || Object.getPrototypeOf(GraphPanel)).apply(this, arguments));
    }

    _createClass(GraphPanel, [{
        key: 'setupChart',
        value: function setupChart(canvas) {
            this.canvas = this.canvas || canvas;

            var statistics = this.props.statistics;

            var quizNames = [];
            var quizScores = [];
            for (var quiz_id in statistics) {
                var score = 0;
                var total = 0;
                for (var question_id in statistics[quiz_id]['questions']) {
                    var question = statistics[quiz_id]['questions'][question_id];
                    score += question['score'];
                    total += question['total'];
                }
                quizNames.push(unescapeHTML(statistics[quiz_id]['name']));
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

            this.chart = new Chart(this.canvas, {
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
                        }]
                    }
                }
            });
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