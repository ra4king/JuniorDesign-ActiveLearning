import React from 'react';
import ReactDOM from 'react-dom';
import socket from './socket.jsx';

import ProfessorApp from './professor/professor-app.jsx';
//import StudentApp from './student/student-app.jsx';

import { browserHistory } from 'react-router';

window.onload = () => {
    ReactDOM.render(<ProfessorApp />, document.getElementById('page'));
}
