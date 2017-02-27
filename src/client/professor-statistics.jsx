window.onload = () => {
    ReactDOM.render(<StatisticsPanels statistics={statistics}/>, document.getElementById('panels'));
}

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


class StatisticsPanels extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            showAllStudents: true
        }
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
            <div>
                <HeaderPanel />

                <SidePanel
                    showStudentStats={this.showStudentStats.bind(this)}
                    showQuizStats={this.showQuizStats.bind(this)}
                    showAllQuizStats={this.showAllQuizStats.bind(this)}
                    showAllStudentStats={this.showAllStudentStats.bind(this)}
                    statistics={this.props.statistics} />

                <GraphPanel
                    showStudent={this.state.showStudent}
                    showQuiz={this.state.showQuiz}
                    showAllQuizzes={this.state.showAllQuizzes}
                    showAllStudents={this.state.showAllStudents}
                    statistics={this.props.statistics} />
            </div>
        );
    }
}

class HeaderPanel extends React.Component {
    render() {
        return (
            <div id='header-panel'>
                <img id='logo' src='images/active_learning_logo_white.png' width='175' height='75' alt='logo'/>
                <h2 id='name'>{username}</h2>
                <nav>
                    <form method='post'>
                        <button className='header-nav-link' formAction='api/logout'>Logout</button>
                    </form>
                    <a href='settings' className='header-nav-link'>Settings</a>
                    <a href='statistics' className='header-nav-link' id='selected'>Statistics</a>
                    <a href='./' className='header-nav-link'>Home</a>
                </nav>
            </div>
        );
    }
}

class SidePanel extends React.Component {
    constructor(props) {
        super(props);

        var quizNames = [];
        for(var username in statistics) {
            for(var quiz_id in statistics[username]) {
                var quizName = statistics[username][quiz_id].name;
                if(quizNames.indexOf(quizName) == -1) {
                    quizNames.push(quizName);
                }
            }
        }

        this.state = {
            showStudents: true,
            quizzes: quizNames
        }
    }

    showStudents() {
        this.setState({ showStudents: true });
        this.props.showAllStudentStats();
    }

    showQuizzes() {
        this.setState({ showStudents: false });
        this.props.showAllQuizStats();
    }

    render() {
        return (
            <div className='panel' id='student-panel'>
                <ul className='tab'>
                    <li>
                        <a href='#' className={'tablinks' + (this.state.showStudents ? ' active' : '')} onClick={this.showStudents.bind(this)}>
                            Students
                        </a>
                    </li>
                    <li>
                        <a href='#' className={'tablinks' + (this.state.showStudents ? '' : ' active')} onClick={this.showQuizzes.bind(this)}>
                            Quizzes
                        </a>
                    </li>
                </ul>

                {this.state.showStudents
                    ? (<table className='sortable tabcontent' id='student-list'>
                        <thead>
                            <tr><th>Students</th></tr>
                        </thead>
                        <tbody id='student-buttons'>
                            {Object.keys(this.props.statistics).map((studentName) => (
                                <tr key={studentName}>
                                    <td>
                                        <button className='list-button' onClick={() => this.props.showStudentStats(studentName)}>
                                            {studentName}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>)
                    : (<table className='sortable tabcontent' id='quiz-list'>
                        <thead>
                            <tr><th>Quizzes</th></tr>
                        </thead>
                        <tbody id='quiz-buttons'>
                            {this.state.quizzes.map((quizName, idx) => (
                                <tr key={idx + '-' + quizName}>
                                    <td>
                                        <button className='list-button' onClick={() => this.props.showQuizStats(quizName)}>
                                            {quizName}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>)}
            </div>
        );
    }
}

class GraphPanel extends React.Component {
    createChart(info, displayX) {
        return new Chart(document.getElementById('statistics-chart'), {
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
        var statistics = this.props.statistics;

        var quizNames = [];
        var quizScores = [];

        for (var quiz_id in statistics[username]) {
            var score = 0;
            var total = 0;
            for (var question_id in statistics[username][quiz_id]['questions']){
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
        }

        if(this.chart) {
            this.chart.destroy();
        }
        this.chart = this.createChart(info, true);
    }

    displayQuizStatistics(name) {
        var questions = {}
        for (var username in statistics){
            for (var quiz_id in statistics[username]) {
                if (statistics[username][quiz_id]['name'] == name) {
                    for (var question_id in statistics[username][quiz_id]['questions']){
                        var prevScore = 0;
                        var prevTotal = 0;
                        var prevA = 0;
                        var prevB = 0;
                        var prevC = 0;
                        var prevD = 0
                        var question_name = statistics[username][quiz_id]['questions'][question_id]['name'];
                        var question = statistics[username][quiz_id]['questions'][question_id];
                        if (questions[question_name] != null){
                            prevScore = questions[question_name]['score'];
                            prevTotal = questions[question_name]['total'];
                            prevA = questions[question_name]['A'];
                            prevB = questions[question_name]['B'];
                            prevC = questions[question_name]['C'];
                            prevD = questions[question_name]['D'];
                        }
                        if (question['answer'] == 0){
                            prevA += question['total'];
                        }
                        if (question['answer'] == 1){
                            prevB += question['total'];
                        }
                        if (question['answer'] == 2){
                            prevC += question['total'];
                        }
                        if (question['answer'] == 3){
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
        var labels = []
        var data = []
        for(question in questions) {
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
        }

        if(this.chart) {
            this.chart.destroy();
        }
        this.chart = this.createChart(info, false);
    }

    displayAllQuizStatistics() {
        var statistics = this.props.statistics;

        var quizzes = {}

        for (var username in statistics){
            for (var quiz_id in statistics[username]){
                var quizName = statistics[username][quiz_id]['name'];
                var score = 0;
                var total = 0;
                for (var question_id in statistics[username][quiz_id]['questions']){
                    var question = statistics[username][quiz_id]['questions'][question_id];
                    score += question['score'];
                    total += question['total'];
                }
                if(quizzes[quizName] != null) {
                    quizzes[quizName]['score'] += score; 
                    quizzes[quizName]['total'] += total; 
                } else {
                    quizzes[quizName] = {score: score, total: total};
                }
            }
        }
        var labels = []
        var data = []
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
        }
        
        if(this.chart) {
            this.chart.destroy();
        }
        this.chart = this.createChart(info, true);
    }

    displayAllStudentStatistics() {
        var statistics = this.props.statistics;

        var usernames = [];
        var scores = [];

        for(var username in statistics) {
            var grade = 0;
            var count = 0;
            for(var quiz_id in statistics[username]) {
                var score = 0;
                var total = 0;
                for (var question_id in statistics[username][quiz_id]['questions']){
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
        }

        if(this.chart) {
            this.chart.destroy();
        }
        this.chart = this.createChart(info, true);
    }

    setupChart(canvas) {
        this.canvas = canvas;

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
            <div id='statistics-panel'>
                <canvas ref={this.setupChart.bind(this)} id='statistics-chart'></canvas>
            </div>
        );
    }
}
