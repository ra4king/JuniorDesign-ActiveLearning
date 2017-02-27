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
    render() {
        return (
            <div>
                <HeaderPanel />

                <GraphPanel statistics={this.props.statistics} />
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
                    <a href='statistics' className='header-nav-link' id='selected'>Statistics</a>
                    <a href='./' className='header-nav-link'>Home</a>
                </nav>
            </div>
        );
    }
}

class GraphPanel extends React.Component {
    setupChart(canvas) {
        var statistics = this.props.statistics;

        var quizNames = [];
        var quizScores = [];
        for (var quiz_id in statistics) {
            var score = 0;
            var total = 0;
            for (var question_id in statistics[quiz_id]['questions']){
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
        }
        
        if (this.chart) {
            this.chart.destroy();
        }
        
        this.chart = new Chart(canvas, {
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
            <div id='statistics-panel'>
                <canvas ref={this.setupChart.bind(this)} id='statistics-chart'></canvas>
            </div>
        );
    }
}
