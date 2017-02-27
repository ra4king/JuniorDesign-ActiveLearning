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

        props.setPage('statistics');

        this.state = {
            statistics: {}
        }

        socket.on('login', (user) => {
            socket.send('get_stats', (err, stats) => {
                if(err) {
                    console.error('Error getting stats: ' + err);
                } else {
                    this.setState({ statistics: stats[user.username] });
                }
            });
        });
    }

    render() {
        return (
            <div>
                <GraphPanel statistics={this.state.statistics} />
            </div>
        );
    }
}

class GraphPanel extends React.Component {
    setupChart(canvas) {
        this.canvas = this.canvas || canvas;

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
            <div id='statistics-panel'>
                <canvas ref={this.setupChart.bind(this)} id='statistics-chart'></canvas>
            </div>
        );
    }
}
