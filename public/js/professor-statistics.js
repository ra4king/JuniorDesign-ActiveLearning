var chart = null;

function createChart(info, displayX) {
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
                backgroundColor: 'rgba(100, 129, 237, 0.5)',
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
                backgroundColor: 'rgba(100, 129, 237, 0.5)',
                borderColor: 'rgba(200, 200, 200, 1)',
                borderWidth: 2
            }]
        }
    chart.destroy();
    chart = createChart(info, true);
}

function displayQuizStatistics(name) {
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
    chart.destroy();
    chart = createChart(info, false);
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
                var prevA = 0;
                var prevB = 0;
                var prevC = 0;
                var prevD = 0
                var name = statistics[username][quiz_id]['questions'][question_id]['name'];
                var question = statistics[username][quiz_id]['questions'][question_id];
                if (questions[name] != null){
                    prevScore = questions[name]['score'];
                    prevTotal = questions[name]['total'];
                    prevA = questions[name]['A'];
                    prevB = questions[name]['B'];
                    prevC = questions[name]['C'];
                    prevD = questions[name]['D'];
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



                questions[name] = {
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

    var labels = [];
    var data = [];

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
    if (chart != null) {
        chart.destroy();
    }
    chart = createChart(info, false);
}

$(window).bind('load', function() {
    loadStatistics(true);
});
