var chart = null;

function createChart(info, displayX) {
    return new Chart(document.getElementById('statistics-chart'), {
            type: 'bar', 
            data: info,
            options: {
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

function displayAllQuizStatistics() {
    quizzes = {}

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
    labels = []
    data = []
    for (var quizName in quizzes) {
        labels.push(unescapeHTML(quizName));
        data.push(100.0 * (quizzes[quizName]['score'] / quizzes[quizName]['total']));
    }
    var info = {
            labels: labels,
            datasets: [{
                label: '% correct answers',
                data: data,
                backgroundColor: 'rgba(225, 225, 225, 0.2)',
                borderColor: 'rgba(200, 200, 200, 1)',
                borderWidth: 2
            }]
        }
    chart.destroy();
    chart = createChart(info, true);

}

function displayStudentStatistics(username){
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
                backgroundColor: 'rgba(225, 225, 225, 0.2)',
                borderColor: 'rgba(200, 200, 200, 1)',
                borderWidth: 2
            }]
        }
    chart.destroy();
    chart = createChart(info, true);
}

function displayQuizStatistics(name) {
    var score = 0;
    var total = 0;
    for (var username in statistics){
        for (var quiz_id in statistics[username]) {
            if (statistics[username][quiz_id]['name'] == name) {
                for (var question_id in statistics[username][quiz_id]['questions']){
                    var question = statistics[username][quiz_id]['questions'][question_id];
                    score += question['score'];
                    total += question['total'];
                }
            }
        }
    }
    var info = {
            labels: [unescapeHTML(name)],
            datasets: [{
                label: '% correct answers',
                data: [100.0 * (score / total)],
                backgroundColor: 'rgba(225, 225, 225, 0.2)',
                borderColor: 'rgba(200, 200, 200, 1)',
                borderWidth: 2
            }]
        }
    chart.destroy();
    chart = createChart(info, true);
}

function createButton(name, functionName, id) {
    parent = document.getElementById(id);
    
    button = document.createElement('BUTTON');
    button.setAttribute('onclick', functionName +'(\'' + name +'\')');
    button.setAttribute('class', 'list-button');
    text = document.createTextNode(name);
    button.appendChild(text);

    col = document.createElement('TD');
    col.appendChild(button);

    row = document.createElement('TR');
    row.appendChild(col);
    
    parent.appendChild(row);
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
function loadStatistics(firstLoad) {
    var questions = {};
    var quizNames = [];
    for (var username in statistics){
        if(firstLoad){
            createButton(username, 'displayStudentStatistics', 'student-buttons');
        }
        for (var quiz_id in statistics[username]){
            var quizName = statistics[username][quiz_id]['name'];
            if(firstLoad && quizNames.indexOf(quizName) == -1) {
                quizNames.push(quizName);
                createButton(quizName, 'displayQuizStatistics', 'quiz-buttons');
            }
            for (var question_id in statistics[username][quiz_id]['questions']){
                var prevScore = 0;
                var prevTotal = 0;
                var name = statistics[username][quiz_id]['questions'][question_id]['name'];
                var question = statistics[username][quiz_id]['questions'][question_id];
                if (questions[name] != null){
                    prevScore = questions[name]['score'];
                    prevTotal = questions[name]['total'];
                }

                questions[name] = {score: prevScore + question['score'], total: prevTotal + question['total']};
            }
        }
    }

    var labels = [];
    var data = [];

    for(question in questions) {
       labels.push(unescapeHTML(question));
       data.push(100.0 * (questions[question]['score'] / questions[question]['total']));
    }
   
    var info = {
        labels: labels,
        datasets: [{
            label: '% correct answers',
            data: data,
            backgroundColor: 'rgba(225, 225, 225, 0.2)',
            borderColor: 'rgba(200, 200, 200, 1)',
            borderWidth: 2
        }]
    }
    if (chart != null) {
        chart.destroy();
    }
    chart = createChart(info, false);
}

$(window).bind('load', function() {
    loadStatistics(true);
});
