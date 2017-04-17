import React from 'react';
import socket from '../socket.jsx';
import { unescapeHTML } from '../utils.jsx';
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
    constructor(props) {
        super(props);

        this.state = {
            showStudent: null,
            showQuiz: null,
            showAllQuizes: false,
            showAllStudents: true
        };
    }

    showStudentStats(studentName) {
        this.setState({
            showStudent: studentName,
            showQuiz: null,
            showAllQuizzes: false,
            showAllStudents: false
        });
    }

    showQuizStats(quizName) {
        this.setState({
            showStudent: null,
            showQuiz: quizName,
            showAllQuizzes: false,
            showAllStudents: false
        });
    }

    showAllQuizStats() {
        this.setState({
            showStudent: null,
            showQuiz: null,
            showAllQuizzes: true,
            showAllStudents: false
        });
    }

    showAllStudentStats() {
        this.setState({
            showStudent: null,
            showQuiz: null,
            showAllQuizzes: false,
            showAllStudents: true
        });
    }

    render() {
        return (
            <div id='panels'>
                <StudentPanel
                    getPermissions={this.props.getPermissions}
                    showStudentStats={this.showStudentStats.bind(this)}
                    showQuizStats={this.showQuizStats.bind(this)}
                    showAllQuizStats={this.showAllQuizStats.bind(this)}
                    showAllStudentStats={this.showAllStudentStats.bind(this)}
                    submissions={this.props.submissions} />

                <GraphPanel
                    showStudent={this.state.showStudent}
                    showQuiz={this.state.showQuiz}
                    showAllQuizzes={this.state.showAllQuizzes}
                    showAllStudents={this.state.showAllStudents}
                    submissions={this.props.submissions} />
            </div>
        );
    }
}

class StudentPanel extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            users: [],
            showStudents: true
        };

        socket.send('getAllUsers', (err, users) => {
            if(err) {
                console.error('Error getting users: ' + err);
            } else {
                var students = [];
                users.forEach((user) => {
                    if(!user.admin && !user.permissions.isCreator && !user.permissions.isTA) {
                        students.push(user);
                    }
                });

                this.setState({ users: students });
            }
        });
    }

    showStudents() {
        this.setState({ showStudents: true });
        this.props.showAllStudentStats();
    }

    showQuizzes() {
        this.setState({ showStudents: false });
        this.props.showAllQuizStats();
    }

    getAllQuizNames() {
        var submissions = this.props.submissions;

        var quizNames = [];
        for(var id in submissions) {
            var quizName = submissions[id].quiz_name;
            if(quizNames.indexOf(quizName) == -1) {
                quizNames.push(quizName);
            }
        }

        return quizNames;
    }

    render() {
        return (
            <div className='panel' id='student-panel'>
                <ul id='tabs'>
                    <li>
                        <a href='#' className={'tablinks' + (this.state.showStudents ? ' tablinks-active' : '')} onClick={this.showStudents.bind(this)}>
                            Students
                        </a>
                    </li>
                    <li>
                        <a href='#' className={'tablinks' + (this.state.showStudents ? '' : ' tablinks-active')} onClick={this.showQuizzes.bind(this)}>
                            Quizzes
                        </a>
                    </li>
                </ul>

                {this.state.showStudents
                    ? (<ul className='student-list'>
                        {this.state.users.map((user) => (
                            <li key={user.username}>
                                <button className='list-button' onClick={() => this.props.showStudentStats(user.username)}>
                                    {user.username}
                                </button>
                            </li>
                        ))}
                    </ul>)
                    : (<ul className='student-list'>
                        {this.getAllQuizNames().map((quizName, idx) => (
                            <li key={idx + '-' + quizName}>
                                <button className='list-button' onClick={() => this.props.showQuizStats(quizName)}>
                                    {quizName}
                                </button>
                            </li>
                        ))}
                    </ul>)}
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

            if(!(submission.username in statistics)) {
                statistics[submission.username] = {};
            }

            statistics[submission.username][submission.quiz_id] = {
                name: submission.quiz_name,
                answers: submission.answers
            };
        }
        return statistics;
    }

    createChart(info, displayX) {
        return new Chart(this.canvas, {
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
                    }],
                    xAxes: [{
                        display: displayX
                    }]
                }
            }
        });
    }

    displayStudentStatistics(username){
        var statistics = this.state.statistics;

        var quizNames = [];
        var quizScores = [];

        for (var quiz_id in statistics[username]) {
            var score = 0;
            var total = 0;
            statistics[username][quiz_id].answers.forEach((question) => {
                score += question.score;
                total += question.total;
            });
            quizNames.push(statistics[username][quiz_id].name);
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

        if(this.chart) {
            this.chart.destroy();
        }
        this.chart = this.createChart(info, true);
    }

    displayQuizStatistics(name) {
        var statistics = this.state.statistics;

        var questions = {}
        for (var username in statistics){
            for (var quiz_id in statistics[username]) {
                if (statistics[username][quiz_id].name == name) {
                    statistics[username][quiz_id].answers.forEach((question) => {
                        var answerScores = [];

                        var prev = questions[question.name] || { score: 0, total: 0, answerScores: new Array(question.options || 0).fill(0) }

                        if(question.answer >= 0) {
                            prev.answerScores[question.answer] += question.total;

                            for(var i = 0; i < prev.answerScores.length; i++) {
                                prev.answerScores[i] = prev.answerScores[i] || 0;
                            }
                        }

                        prev.score += question.score;
                        prev.total += question.total;

                        questions[question.name] = prev;
                    });
                }
            }
        }

        var labels = []
        var data = []
        for(question in questions) {
            var str = question + ' ';
            str += questions[question].answerScores.map((score, idx) => 
                String.fromCharCode('A'.charCodeAt(0) + idx) + ': ' + ((100 * (score / questions[question].total)).toFixed(2)) + '%').join(' ');

            labels.push(str);
            data.push(100.0 * (questions[question].score / questions[question].total));
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
        }

        if(this.chart) {
            this.chart.destroy();
        }
        this.chart = this.createChart(info, false);
    }

    displayAllQuizStatistics() {
        var statistics = this.state.statistics;

        var quizzes = {}

        for (var username in statistics){
            for (var quiz_id in statistics[username]){
                var quizName = statistics[username][quiz_id].name;
                var score = 0;
                var total = 0;
                statistics[username][quiz_id].answers.forEach((question) => {
                    score += question.score;
                    total += question.total;
                });

                if(quizzes[quizName] != null) {
                    quizzes[quizName].score += score; 
                    quizzes[quizName].total += total; 
                } else {
                    quizzes[quizName] = {score: score, total: total};
                }
            }
        }
        var labels = []
        var data = []
        for (var quizName in quizzes) {
            labels.push(quizName);
            data.push(100.0 * (quizzes[quizName].score / quizzes[quizName].total));
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
        }
        
        if(this.chart) {
            this.chart.destroy();
        }
        this.chart = this.createChart(info, true);
    }

    displayAllStudentStatistics() {
        var statistics = this.state.statistics;

        var usernames = [];
        var scores = [];

        for(var username in statistics) {
            var grade = 0;
            var count = 0;
            for(var quiz_id in statistics[username]) {
                var score = 0;
                var total = 0;
                statistics[username][quiz_id].answers.forEach((question) => {
                    score += question.score;
                    total += question.total;
                });

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
        }

        if(this.chart) {
            this.chart.destroy();
        }
        this.chart = this.createChart(info, true);
    }

    setupChart(canvas) {
        this.canvas = this.canvas || canvas;

        if(this.props.showStudent) {
            this.displayStudentStatistics(this.props.showStudent);
        } else if(this.props.showQuiz) {
            this.displayQuizStatistics(this.props.showQuiz);
        } else if(this.props.showAllQuizzes) {
            this.displayAllQuizStatistics();
        } else {
            this.displayAllStudentStatistics();
        }
    }

    render() {
        return (
            <div className='panel' id='statistics-panel'>
                <canvas ref={this.setupChart.bind(this)} id='statistics-chart'></canvas>
            </div>
        );
    }
}
