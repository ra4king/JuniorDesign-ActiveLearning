var chart = null;



function displayStudentStatistics(){
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
    // console.log(quizNames);
    // console.log(quizScores);

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
    if (chart != null) {
        chart.destroy();
    }
    chart = new Chart(document.getElementById('statistics-chart'), {
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

$(window).bind('load', function() {
    displayStudentStatistics();
});
