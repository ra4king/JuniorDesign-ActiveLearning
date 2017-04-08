import React from 'react';
import socket from '../socket.jsx';
import Chart from 'chart.js';

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

export default class StatisticsPanels extends React.Component {
    render() {
        return (
            <div id='panels'>
                <GraphPanel submissions={this.props.submissions} />
            </div>
        );
    }
}

class GraphPanel extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            statistics: this.getStatistics(props.submissions)
        };
    }

    componentWillReceiveProps(newProps) {
        this.setState({ statistics: this.getStatistics(newProps.submissions) });
    }

    getStatistics(submissions) {
        var statistics = {};
        for(var id in submissions) {
            var submission = submissions[id];

            statistics[submission.quiz_id] = {
                name: submission.quiz_name,
                answers: submission.answers
            };
        }
        return statistics;
    }

    setupChart(canvas) {
        this.canvas = this.canvas || canvas;

        var statistics = this.state.statistics;

        var quizNames = [];
        var quizScores = [];
        for (var quiz_id in statistics) {
            var score = 0;
            var total = 0;
            for (var question_id in statistics[quiz_id].answers){
                var question = statistics[quiz_id].answers[question_id];
                score += question.score;
                total += question.total;
            }
            quizNames.push(statistics[quiz_id].name);
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
        }

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
                            beginAtZero:true,
                            max: 100
                        }
                    }]
                }
            }
        });
    }

    render() {
        return (
            <div id='student-statistics-panel' className='panel'>
                <canvas ref={this.setupChart.bind(this)} id='statistics-chart'></canvas>
            </div>
        );
    }
}
