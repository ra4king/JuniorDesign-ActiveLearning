webpackJsonp([0],{11:function(e,t,n){"use strict";function s(e){if(null==e)return"";for(var t;(t=decodeURIComponent(e).replace(r,function(e){return a[e]}))!=e;)e=t;return e}function i(e){for(var t=e+"=",n=document.cookie.split(";"),s=0;s<n.length;s++){var i=n[s].trim();if(0==i.indexOf(t))return decodeURIComponent(i.substring(t.length,i.length))}return null}Object.defineProperty(t,"__esModule",{value:!0}),t.unescapeHTML=s,t.readCookie=i;var a={"&apos;":"'","&#39;":"'","&amp;":"&","&gt;":">","&lt;":"<","&quot;":'"'},r=new RegExp("("+Object.keys(a).join("|")+")","g")},19:function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var s=n(11);t.default=new function(){function e(){return null!=t||(alert("No connection to the server. Attemping to reconnect..."),l(),!1)}var t,n=this,i={},a={},r=(0,s.readCookie)("session_id"),o=!1,u=!1,l=function e(){if(null==r)return void console.error("Could not find session_id cookie?!");if(!o){o=!0,console.log("Connecting...");var s=new WebSocket("wss://www.roiatalla.com/active-learning/api");s.onopen=function(){t=s,console.log("Connected to server!"),n.send("login",r,function(e,t){e?console.error("Failed to authenticate to API."):console.log("Successfully logged in."),u=!0,n.emit("login",t)})},s.onmessage=function(e){var t=JSON.parse(e.data);if(a[t.id]){var s=a[t.id];s.callback(t.err,t.data,s.request),delete a[t.id]}else t.err||n.emit(t.id,t.data)},s.onclose=function(){t=null,u=!1,o=!1,console.log("Connection closed."),setTimeout(e,1e3)}}};this.isConnected=function(){return null!=t},this.isLoggedIn=function(){return u},this.on=function(e,t){i[e]=i[e]||[],i[e].push(t)},this.once=function(e,t){var s=function e(s){t(s),n.remove(e)};n.on(e,s)},this.remove=function(e,t){var n=i[e].indexOf(t);n>=0&&i[e].splice(n,1)},this.emit=function(e,t){i[e]&&i[e].forEach(function(e){return e(t)})};var c=0;this.send=function(n,s,i){if(!n)return i("Invalid command");if("function"==typeof s&&(i=s,s=void 0),e()){var r={id:c++,command:n,data:s};t.send(JSON.stringify(r)),i&&"function"==typeof i&&(a[r.id]={request:r,callback:i})}else i&&"function"==typeof i&&i("Not connected")},l()}},225:function(e,t,n){"use strict";function s(e){return e&&e.__esModule?e:{default:e}}function i(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}function a(e,t){if(!e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return!t||"object"!=typeof t&&"function"!=typeof t?e:t}function r(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function, not "+typeof t);e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t)}Object.defineProperty(t,"__esModule",{value:!0});var o=function(){function e(e,t){for(var n=0;n<t.length;n++){var s=t[n];s.enumerable=s.enumerable||!1,s.configurable=!0,"value"in s&&(s.writable=!0),Object.defineProperty(e,s.key,s)}}return function(t,n,s){return n&&e(t.prototype,n),s&&e(t,s),t}}(),u=n(3),l=s(u),c=n(19),d=s(c),f=n(11),h=function(e){function t(e){i(this,t);var n=a(this,(t.__proto__||Object.getPrototypeOf(t)).call(this,e));return n.state={users:[],selectedUser:null},d.default.isLoggedIn()?n.getUsers():d.default.on("login",n.getUsers.bind(n)),n}return r(t,e),o(t,[{key:"getUsers",value:function(){var e=this;d.default.send("get_users",function(t,n){t?console.error("Error getting users: "+t):e.setState({users:n})})}},{key:"selectUser",value:function(e){this.setState({selectedUser:e})}},{key:"render",value:function(){return l.default.createElement("div",null,l.default.createElement(p,{users:this.state.users,selectUser:this.selectUser.bind(this)}),l.default.createElement(m,{users:this.state.users,selectedUser:this.state.selectedUser}))}}]),t}(l.default.Component);t.default=h;var p=function(e){function t(e){i(this,t);var n=a(this,(t.__proto__||Object.getPrototypeOf(t)).call(this,e));return n.state={showStudents:!0},n}return r(t,e),o(t,[{key:"showStudents",value:function(){this.setState({showStudents:!0})}},{key:"showTAs",value:function(){this.setState({showStudents:!1})}},{key:"render",value:function(){var e=this;return l.default.createElement("div",{className:"panel",id:"student-panel"},l.default.createElement("ul",{className:"tab"},l.default.createElement("li",null,l.default.createElement("a",{href:"#",className:"tablinks"+(this.state.showStudents?" active":""),onClick:this.showStudents.bind(this)},"Students")),l.default.createElement("li",null,l.default.createElement("a",{href:"#",className:"tablinks"+(this.state.showStudents?"":" active"),onClick:this.showTAs.bind(this)},"TAs"))),this.state.showStudents?l.default.createElement("table",{className:"sortable tabcontent",id:"student-list"},l.default.createElement("thead",null,l.default.createElement("tr",null,l.default.createElement("th",null,"Users"))),l.default.createElement("tbody",{id:"student-buttons"},this.props.users.map(function(t){return l.default.createElement("tr",{key:t.username},l.default.createElement("td",null,l.default.createElement("button",{className:"list-button",onClick:function(){return e.props.selectUser(t)}},(0,f.unescapeHTML)(t.username))))}))):l.default.createElement("table",{className:"sortable tabcontent",id:"ta-list"},l.default.createElement("thead",null,l.default.createElement("tr",null,l.default.createElement("th",null,"Teaching Assistants"))),l.default.createElement("tbody",{id:"ta-buttons"})))}}]),t}(l.default.Component),m=function(e){function t(){return i(this,t),a(this,(t.__proto__||Object.getPrototypeOf(t)).apply(this,arguments))}return r(t,e),o(t,[{key:"render",value:function(){return l.default.createElement("div",{className:"panel",id:"permission-panel"},l.default.createElement("p",null,this.props.selectedUser?"Selected "+(0,f.unescapeHTML)(this.props.selectedUser.username)+".":"Select a user from the side panel."),l.default.createElement("p",null,"What else are we going to put here?"),l.default.createElement("button",{id:"make-ta-button"},"Make a TA"))}}]),t}(l.default.Component)},226:function(e,t,n){"use strict";function s(e){return e&&e.__esModule?e:{default:e}}function i(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}function a(e,t){if(!e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return!t||"object"!=typeof t&&"function"!=typeof t?e:t}function r(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function, not "+typeof t);e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t)}Object.defineProperty(t,"__esModule",{value:!0});var o=function(){function e(e,t){for(var n=0;n<t.length;n++){var s=t[n];s.enumerable=s.enumerable||!1,s.configurable=!0,"value"in s&&(s.writable=!0),Object.defineProperty(e,s.key,s)}}return function(t,n,s){return n&&e(t.prototype,n),s&&e(t,s),t}}(),u=n(3),l=s(u),c=n(19),d=s(c),f=n(11),h=n(183),p=s(h),m=function(e){function t(e){i(this,t);var n=a(this,(t.__proto__||Object.getPrototypeOf(t)).call(this,e));return n.state={statistics:{},showAllStudents:!0},d.default.isLoggedIn()?n.getStats():d.default.on("login",n.getStats.bind(n)),n}return r(t,e),o(t,[{key:"getStats",value:function(){var e=this;d.default.send("get_stats",function(t,n){t?console.error("Error getting stats: "+t):e.setState({statistics:n})})}},{key:"showStudentStats",value:function(e){this.setState({showStudent:e,showQuiz:null,showAllQuizzes:!1,showAllStudents:!1})}},{key:"showQuizStats",value:function(e){this.setState({showStudent:null,showQuiz:e,showAllQuizzes:!1,showAllStudents:!1})}},{key:"showAllQuizStats",value:function(){this.setState({showStudent:null,showQuiz:null,showAllQuizzes:!0,showAllStudents:!1})}},{key:"showAllStudentStats",value:function(){this.setState({showStudent:null,showQuiz:null,showAllQuizzes:!1,showAllStudents:!0})}},{key:"render",value:function(){return l.default.createElement("div",null,l.default.createElement(v,{showStudentStats:this.showStudentStats.bind(this),showQuizStats:this.showQuizStats.bind(this),showAllQuizStats:this.showAllQuizStats.bind(this),showAllStudentStats:this.showAllStudentStats.bind(this),statistics:this.state.statistics}),l.default.createElement(g,{showStudent:this.state.showStudent,showQuiz:this.state.showQuiz,showAllQuizzes:this.state.showAllQuizzes,showAllStudents:this.state.showAllStudents,statistics:this.state.statistics}))}}]),t}(l.default.Component);t.default=m;var v=function(e){function t(e){i(this,t);var n=a(this,(t.__proto__||Object.getPrototypeOf(t)).call(this,e));return n.state={showStudents:!0},n}return r(t,e),o(t,[{key:"showStudents",value:function(){this.setState({showStudents:!0}),this.props.showAllStudentStats()}},{key:"showQuizzes",value:function(){this.setState({showStudents:!1}),this.props.showAllQuizStats()}},{key:"getAllQuizNames",value:function(){var e=this.props.statistics,t=[];for(var n in e)for(var s in e[n]){var i=e[n][s].name;t.indexOf(i)==-1&&t.push(i)}return t}},{key:"render",value:function(){var e=this;return l.default.createElement("div",{className:"panel",id:"student-panel"},l.default.createElement("ul",{className:"tab"},l.default.createElement("li",null,l.default.createElement("a",{href:"#",className:"tablinks"+(this.state.showStudents?" active":""),onClick:this.showStudents.bind(this)},"Students")),l.default.createElement("li",null,l.default.createElement("a",{href:"#",className:"tablinks"+(this.state.showStudents?"":" active"),onClick:this.showQuizzes.bind(this)},"Quizzes"))),this.state.showStudents?l.default.createElement("table",{className:"sortable tabcontent",id:"student-list"},l.default.createElement("thead",null,l.default.createElement("tr",null,l.default.createElement("th",null,"Students"))),l.default.createElement("tbody",{id:"student-buttons"},Object.keys(this.props.statistics).map(function(t){return l.default.createElement("tr",{key:t},l.default.createElement("td",null,l.default.createElement("button",{className:"list-button",onClick:function(){return e.props.showStudentStats(t)}},t)))}))):l.default.createElement("table",{className:"sortable tabcontent",id:"quiz-list"},l.default.createElement("thead",null,l.default.createElement("tr",null,l.default.createElement("th",null,"Quizzes"))),l.default.createElement("tbody",{id:"quiz-buttons"},this.getAllQuizNames().map(function(t,n){return l.default.createElement("tr",{key:n+"-"+t},l.default.createElement("td",null,l.default.createElement("button",{className:"list-button",onClick:function(){return e.props.showQuizStats(t)}},t)))}))))}}]),t}(l.default.Component),g=function(e){function t(){return i(this,t),a(this,(t.__proto__||Object.getPrototypeOf(t)).apply(this,arguments))}return r(t,e),o(t,[{key:"createChart",value:function(e,t){return new p.default(document.getElementById("statistics-chart"),{type:"bar",data:e,options:{maintainAspectRatio:!1,scales:{yAxes:[{ticks:{beginAtZero:!0,max:100}}],xAxes:[{display:t}]}}})}},{key:"displayStudentStatistics",value:function(e){var t=this.props.statistics,n=[],s=[];for(var i in t[e]){var a=0,r=0;for(var o in t[e][i].questions){var u=t[e][i].questions[o];a+=u.score,r+=u.total}n.push((0,f.unescapeHTML)(t[e][i].name)),s.push(100*(a/r))}var l={labels:n,datasets:[{label:"% correct answers",data:s,backgroundColor:"rgba(100, 129, 237, 0.5)",borderColor:"rgba(200, 200, 200, 1)",borderWidth:2}]};this.chart&&this.chart.destroy(),this.chart=this.createChart(l,!0)}},{key:"displayQuizStatistics",value:function(e){var t=this.props.statistics,n={};for(var s in t)for(var i in t[s])if(t[s][i].name==e)for(var a in t[s][i].questions){var r=0,o=0,u=0,l=0,c=0,d=0,h=t[s][i].questions[a].name,p=t[s][i].questions[a];null!=n[h]&&(r=n[h].score,o=n[h].total,u=n[h].A,l=n[h].B,c=n[h].C,d=n[h].D),0==p.answer&&(u+=p.total),1==p.answer&&(l+=p.total),2==p.answer&&(c+=p.total),3==p.answer&&(d+=p.total),n[h]={score:r+p.score,total:o+p.total,A:u,B:l,C:c,D:d}}var m=[],v=[];for(p in n){var g=(0,f.unescapeHTML)(p),y=(100*(n[p].A/n[p].total)).toFixed(2),b=(100*(n[p].B/n[p].total)).toFixed(2),w=(100*(n[p].C/n[p].total)).toFixed(2),E=(100*(n[p].D/n[p].total)).toFixed(2);y>0&&(g+=" A: "+y+"%"),b>0&&(g+=" B: "+b+"%"),w>0&&(g+=" C: "+w+"%"),E>0&&(g+=" D: "+E+"%"),m.push(g),v.push(100*(n[p].score/n[p].total))}var k={labels:m,datasets:[{label:"% correct answers",data:v,backgroundColor:"rgba(100, 129, 237, 0.5)",borderColor:"rgba(200, 200, 200, 1)",borderWidth:2}]};this.chart&&this.chart.destroy(),this.chart=this.createChart(k,!1)}},{key:"displayAllQuizStatistics",value:function(){var e=this.props.statistics,t={};for(var n in e)for(var s in e[n]){var i=e[n][s].name,a=0,r=0;for(var o in e[n][s].questions){var u=e[n][s].questions[o];a+=u.score,r+=u.total}null!=t[i]?(t[i].score+=a,t[i].total+=r):t[i]={score:a,total:r}}var l=[],c=[];for(var i in t)l.push((0,f.unescapeHTML)(i)),c.push(100*(t[i].score/t[i].total));var d={labels:l,datasets:[{label:"% correct answers",data:c,backgroundColor:"rgba(100, 129, 237, 0.5)",borderColor:"rgba(200, 200, 200, 1)",borderWidth:2}]};this.chart&&this.chart.destroy(),this.chart=this.createChart(d,!0)}},{key:"displayAllStudentStatistics",value:function(){var e=this.props.statistics,t=[],n=[];for(var s in e){var i=0,a=0;for(var r in e[s]){var o=0,u=0;for(var l in e[s][r].questions){var c=e[s][r].questions[l];o+=c.score,u+=c.total}i+=100*(o/u),a++}t.push((0,f.unescapeHTML)(s)),n.push(i/=a)}var d={labels:t,datasets:[{label:"% grade overall",data:n,backgroundColor:"rgba(100, 129, 237, 0.5)",borderColor:"rgba(200, 200, 200, 1)",borderWidth:2}]};this.chart&&this.chart.destroy(),this.chart=this.createChart(d,!0)}},{key:"setupChart",value:function(e){this.canvas=this.canvas||e,this.props.showStudent?this.displayStudentStatistics(this.props.showStudent):this.props.showQuiz?this.displayQuizStatistics(this.props.showQuiz):this.props.showAllQuizzes?this.displayAllQuizStatistics():this.displayAllStudentStatistics()}},{key:"render",value:function(){return l.default.createElement("div",{id:"statistics-panel"},l.default.createElement("canvas",{ref:this.setupChart.bind(this),id:"statistics-chart"}))}}]),t}(l.default.Component)},391:function(e,t,n){"use strict";function s(e){return e&&e.__esModule?e:{default:e}}function i(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}function a(e,t){if(!e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return!t||"object"!=typeof t&&"function"!=typeof t?e:t}function r(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function, not "+typeof t);e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t)}var o=Object.assign||function(e){for(var t=1;t<arguments.length;t++){var n=arguments[t];for(var s in n)Object.prototype.hasOwnProperty.call(n,s)&&(e[s]=n[s])}return e},u=function(){function e(e,t){for(var n=0;n<t.length;n++){var s=t[n];s.enumerable=s.enumerable||!1,s.configurable=!0,"value"in s&&(s.writable=!0),Object.defineProperty(e,s.key,s)}}return function(t,n,s){return n&&e(t.prototype,n),s&&e(t,s),t}}(),l=n(3),c=s(l),d=n(20),f=s(d),h=n(19),p=s(h),m=n(11),v=n(226),g=s(v),y=n(225),b=s(y),w=n(45);window.onload=function(){f.default.render(c.default.createElement(w.Router,{history:w.browserHistory},c.default.createElement(w.Route,{path:"/active-learning/",component:E},c.default.createElement(w.IndexRoute,{component:_}),c.default.createElement(w.Route,{path:"/active-learning/statistics",component:g.default}),c.default.createElement(w.Route,{path:"/active-learning/settings",component:b.default}))),document.getElementById("panels"))};var E=function(e){function t(e){i(this,t);var n=a(this,(t.__proto__||Object.getPrototypeOf(t)).call(this,e));return n.state={resources:{},questions:{},quizzes:{},showConfirm:null,currentLiveQuiz:null},p.default.on("login",function(e){e&&n.setState({user:e})}),p.default.on("questions",function(e){return n.setState({questions:e})}),p.default.on("quizzes",function(e){return n.setState({quizzes:e})}),n.refresh=n.refresh.bind(n),p.default.isLoggedIn()?n.refresh():p.default.on("login",n.refresh),n}return r(t,e),u(t,[{key:"refresh",value:function(){p.default.send("get_quizzes",function(e,t){return!e&&p.default.emit("quizzes",t)}),p.default.send("get_questions",function(e,t){return!e&&p.default.emit("questions",t)})}},{key:"componentWillUnmount",value:function(){p.default.remove("login",this.refresh)}},{key:"presentLive",value:function(e){this.setState({currentLiveQuiz:this.state.quizzes[e]})}},{key:"hideLiveQuiz",value:function(){this.setState({currentLiveQuiz:null})}},{key:"showConfirm",value:function(e){this.setState({showConfirm:e})}},{key:"hideConfirm",value:function(){this.setState({showConfirm:null})}},{key:"getResource",value:function(e,t){var n=this;this.state.resources[e]?(t&&t(null,this.state.resources[e]),this.setState({questions:this.state.questions})):p.default.send("get_resource",e,function(s,i){if(s)console.error("Failed to load image for question "+question_id+" with resource id "+e+": "+s),t&&t(s);else{var a=n.state.resources;a[e]=i,t&&t(null,i),n.setState({questions:n.state.questions,resources:a})}})}},{key:"render",value:function(){var e=this;return c.default.createElement("div",null,(this.state.currentLiveQuiz||this.state.showConfirm)&&c.default.createElement("div",{id:"overlay"}),this.state.currentLiveQuiz&&c.default.createElement(q,{quiz:this.state.currentLiveQuiz,questions:this.state.questions,resources:this.state.resources,getResource:this.getResource.bind(this),hideLiveQuiz:this.hideLiveQuiz.bind(this)}),this.state.showConfirm&&c.default.createElement(S,o({hide:function(){return e.hideConfirm()}},this.state.showConfirm)),c.default.createElement("div",{className:(this.state.currentLiveQuiz||this.state.showConfirm)&&"blur"},c.default.createElement(k,{user:this.state.user,page:this.state.page}),c.default.Children.map(this.props.children,function(t){return c.default.cloneElement(t,{user:e.state.user,questions:e.state.questions,quizzes:e.state.quizzes,getResource:e.getResource.bind(e),showConfirm:e.showConfirm.bind(e),presentLive:e.presentLive.bind(e)})})))}}]),t}(c.default.Component),k=function(e){function t(){return i(this,t),a(this,(t.__proto__||Object.getPrototypeOf(t)).apply(this,arguments))}return r(t,e),u(t,[{key:"render",value:function(){return c.default.createElement("div",{id:"header-panel"},c.default.createElement("img",{id:"logo",src:"images/active_learning_logo_white.png",width:"175",height:"75",alt:"logo"}),c.default.createElement("h2",{id:"name"},this.props.user?this.props.user.username:""),c.default.createElement("nav",null,c.default.createElement("form",{method:"post"},c.default.createElement("button",{className:"header-nav-link",formAction:"api/logout"},"Logout")),c.default.createElement(w.IndexLink,{to:"/active-learning/settings",className:"header-nav-link",activeClassName:"selected"},"Settings"),c.default.createElement(w.IndexLink,{to:"/active-learning/statistics",className:"header-nav-link",activeClassName:"selected"},"Statistics"),c.default.createElement(w.IndexLink,{to:"/active-learning/",className:"header-nav-link",activeClassName:"selected"},"Home")))}}]),t}(c.default.Component),q=function(e){function t(e){i(this,t);var n=a(this,(t.__proto__||Object.getPrototypeOf(t)).call(this,e));return n.state={currentLiveQuestion:null,onLoginFunc:function(e){null!=n.state.currentLiveQuestion&&p.default.send("broadcast_live_question",n.state.currentLiveQuestion)}},p.default.on("login",n.state.onLoginFunc),n}return r(t,e),u(t,[{key:"componentWillUnmount",value:function(){p.default.remove("login",this.state.onLoginFunc),p.default.send("end_live_question")}},{key:"presentLiveQuestion",value:function(e){this.setState({currentLiveQuestion:e}),p.default.send("broadcast_live_question",e)}},{key:"render",value:function(){var e=this;return c.default.createElement("div",{id:"live-quiz"},c.default.createElement("ol",{id:"live-questions-list"},this.props.quiz.questions.map(function(t){return c.default.createElement(j,{key:t,question:e.props.questions[t],getResource:e.props.getResource},c.default.createElement("button",{className:"presenting-live-button"+(t==e.state.currentLiveQuestion?" presenting-live-button-selected":""),onClick:function(){return e.presentLiveQuestion(t)}},"L"))})),c.default.createElement("button",{onClick:this.props.hideLiveQuiz,className:"delete-button"},"✖"))}}]),t}(c.default.Component),S=function(e){function t(){return i(this,t),a(this,(t.__proto__||Object.getPrototypeOf(t)).apply(this,arguments))}return r(t,e),u(t,[{key:"clicked",value:function(e){this.props.hide(),this.props.onAction&&this.props.onAction(e)}},{key:"render",value:function(){var e=this;return c.default.createElement("div",{id:"confirm-box"},c.default.createElement("p",{id:"confirm-msg"},this.props.title),"yesno"==this.props.type?c.default.createElement("div",null,c.default.createElement("button",{onClick:function(){return e.clicked(!1)},className:"cancel-button"},this.props.noText||"No"),c.default.createElement("button",{onClick:function(){return e.clicked(!0)},className:"confirm-button"},this.props.yesText||"Yes")):c.default.createElement("button",{onClick:function(){return e.clicked()},id:"ok-button"},this.props.okText||"Ok"))}}]),t}(c.default.Component),_=function(e){function t(){return i(this,t),a(this,(t.__proto__||Object.getPrototypeOf(t)).apply(this,arguments))}return r(t,e),u(t,[{key:"render",value:function(){return c.default.createElement("div",null,c.default.createElement(z,{questions:this.props.questions,quizzes:this.props.quizzes,getResource:this.props.getResource,showConfirm:this.props.showConfirm,presentLive:this.props.presentLive}),c.default.createElement(N,{getResource:this.props.getResource,showConfirm:this.props.showConfirm,questions:this.props.questions}))}}]),t}(c.default.Component),z=function(e){function t(e){i(this,t);var n=a(this,(t.__proto__||Object.getPrototypeOf(t)).call(this,e));return n.state={editQuiz:null},n}return r(t,e),u(t,[{key:"chooseQuiz",value:function(e){this.setState({editQuiz:this.props.quizzes[e]})}},{key:"toggleQuizEditor",value:function(){this.setState(function(e){return{editQuiz:e.editQuiz?null:{}}})}},{key:"hideQuizEditor",value:function(){this.setState({editQuiz:null})}},{key:"render",value:function(){var e=this;return c.default.createElement("div",{id:"quiz-panel"},c.default.createElement("button",{className:"option-button",onClick:function(){return e.toggleQuizEditor()}},this.state.editQuiz?"Cancel":"Create Quiz"),this.state.editQuiz?c.default.createElement(C,{quiz:this.state.editQuiz,questions:this.props.questions,hideQuizEditor:this.hideQuizEditor.bind(this),getResource:this.props.getResource,showConfirm:this.props.showConfirm}):c.default.createElement(Q,{showConfirm:this.props.showConfirm,quizzes:this.props.quizzes,chooseQuiz:this.chooseQuiz.bind(this),presentLive:this.props.presentLive}))}}]),t}(c.default.Component),C=function(e){function t(e){i(this,t);var n=a(this,(t.__proto__||Object.getPrototypeOf(t)).call(this,e));return n.state={id:e.quiz.id,name:e.quiz.name||"",questions:e.quiz.questions||[]},n.questionsDOM={},n}return r(t,e),u(t,[{key:"onNameChange",value:function(e){this.setState({name:e.target.value})}},{key:"submitQuiz",value:function(){var e=this,t=function(t){t?e.props.showConfirm({type:"ok",title:t}):e.props.hideQuizEditor()};this.state.id?p.default.send("update_quiz",{id:this.state.id,name:this.state.name,questions:this.state.questions},t):p.default.send("create_quiz",{name:this.state.name,questions:this.state.questions},t)}},{key:"removeQuestion",value:function(e){this.setState(function(t){var n=t.questions.slice(),s=n.indexOf(e);return s!=-1?(n.splice(s,1),{questions:n}):{}})}},{key:"onDragStart",value:function(e,t){t.dataTransfer.setData("question-id",e)}},{key:"getDropTargetId",value:function(e){for(var t=e.target;t&&(!t.dataset||!t.dataset.id);)t=t.parentNode;return t&&t.dataset.id}},{key:"onDrop",value:function(e){this.setState({dragOverId:null}),e.preventDefault();var t=e.dataTransfer.getData("question-id");if(t){var n=this.getDropTargetId(e);this.setState(function(e){var s=e.questions.slice();if(n){if(t!=n){var i=s.indexOf(t),a=s.indexOf(n);i!=-1&&s.splice(i,1),a!=-1?s.splice(a,0,t):s.push(t)}}else{var i=s.indexOf(t);i!=-1&&s.splice(i,1),s.push(t)}return{questions:s}})}}},{key:"onDragOver",value:function(e){e.preventDefault();var t=this.getDropTargetId(e);t!=this.state.dragOverId&&this.setState({dragOverId:t})}},{key:"render",value:function(){var e=this;return c.default.createElement("div",{id:"quiz-creator"},c.default.createElement("div",{id:"quiz-creator-header"},c.default.createElement("div",{id:"quiz-name"},"Name: ",c.default.createElement("input",{type:"text",id:"quiz-name-field",value:this.state.name,onChange:this.onNameChange.bind(this)})),c.default.createElement("div",{id:"submit-quiz"},c.default.createElement("button",{id:"submit-quiz-button",onClick:this.submitQuiz.bind(this)},this.state.id?"Update":"Submit"))),c.default.createElement("ol",{id:"quiz-question-list",onDrop:this.onDrop.bind(this),onDragOver:this.onDragOver.bind(this)},this.state.questions.length>0?[this.state.questions.map(function(t){return c.default.createElement(j,{key:t,question:e.props.questions[t],getResource:e.props.getResource,draggable:!0,onDragStart:e.onDragStart.bind(e,t),draggedOver:e.state.dragOverId==t},c.default.createElement("button",{className:"delete-button",onClick:function(){return e.removeQuestion(t)}},"✖"))}),c.default.createElement("li",{key:"hidden",style:{visibility:"hidden",height:"100px"}})]:c.default.createElement("li",{style:{listStyleType:"none",textAlign:"center"}},"Drag questions here!")))}}]),t}(c.default.Component),Q=function(e){function t(){return i(this,t),a(this,(t.__proto__||Object.getPrototypeOf(t)).apply(this,arguments))}return r(t,e),u(t,[{key:"render",value:function(){var e=this;return c.default.createElement("ol",{className:"quiz-list"},Object.keys(this.props.quizzes).map(function(t){var n=e.props.quizzes[t];return c.default.createElement(O,{key:t,quiz:n,chooseQuiz:function(){return e.props.chooseQuiz(t)},presentLive:function(){return e.props.presentLive(t)},showConfirm:e.props.showConfirm})}))}}]),t}(c.default.Component),O=function(e){function t(){return i(this,t),a(this,(t.__proto__||Object.getPrototypeOf(t)).apply(this,arguments))}return r(t,e),u(t,[{key:"deleteQuiz",value:function(){var e=this;this.props.showConfirm({type:"yesno",title:"Are you sure you want to delete this quiz?",onAction:function(t){t&&p.default.send("delete_quiz",e.props.quiz.id,function(t,n){t&&e.props.showConfirm({type:"ok",title:t})})}})}},{key:"render",value:function(){return c.default.createElement("li",{className:"quiz"},c.default.createElement("button",{className:"quiz-body",onClick:this.props.chooseQuiz},(0,m.unescapeHTML)(this.props.quiz.name)),c.default.createElement("button",{className:"delete-button",onClick:this.deleteQuiz.bind(this)},"✖"),c.default.createElement("button",{className:"live-button",onClick:this.props.presentLive},"L"))}}]),t}(c.default.Component),N=function(e){function t(e){i(this,t);var n=a(this,(t.__proto__||Object.getPrototypeOf(t)).call(this,e));return n.state={editQuestion:null},n}return r(t,e),u(t,[{key:"chooseQuestion",value:function(e){this.setState({editQuestion:this.props.questions[e]})}},{key:"toggleQuestionEditor",value:function(){this.setState(function(e){return{editQuestion:e.editQuestion?null:{}}})}},{key:"hideQuestionEditor",value:function(){this.setState({editQuestion:null})}},{key:"getFolderHierarchy",value:function(){var e=[];for(var t in this.props.questions){var n=this.props.questions[t];n.tags&&n.tags.forEach(function(t){e.indexOf(t)==-1&&e.push(t)})}return[{name:"CS 2110",children:e}]}},{key:"render",value:function(){return c.default.createElement("div",{id:"question-panel"},c.default.createElement("button",{className:"option-button",onClick:this.toggleQuestionEditor.bind(this)},this.state.editQuestion?"Cancel":"Create Question"),this.state.editQuestion?c.default.createElement(A,{question:this.state.editQuestion,getResource:this.props.getResource,hideQuestionEditor:this.hideQuestionEditor.bind(this),showConfirm:this.props.showConfirm}):[c.default.createElement("div",{key:"hierarchy",id:"hierarchy-panel"},c.default.createElement(T,{tags:this.getFolderHierarchy()})),c.default.createElement(L,{key:"questions",questions:this.props.questions,getResource:this.props.getResource,chooseQuestion:this.chooseQuestion.bind(this),showConfirm:this.props.showConfirm})])}}]),t}(c.default.Component),A=function(e){function t(e){i(this,t);var n=a(this,(t.__proto__||Object.getPrototypeOf(t)).call(this,e));return n.state={id:e.question.id,title:e.question.name||"",answers:e.question.answers||["","","",""],correct:e.question.correct||0,image_id:e.question.image_id||null,tags:e.question.tags||[],tag:""},n}return r(t,e),u(t,[{key:"componentWillMount",value:function(){var e=this;this.state.image_id&&this.props.getResource(this.state.image_id,function(t,n){return e.setState({image:n})})}},{key:"changeTitle",value:function(e){this.setState({title:e.target.value})}},{key:"changeAnswer",value:function(e,t){var n=t.target.value;this.setState(function(t){var s=t.answers.slice();return s[e]=String(n),{answers:s}})}},{key:"addAnswer",value:function(){this.setState(function(e){var t=e.answers.slice();return t.push(""),{answers:t}})}},{key:"removeAnswer",value:function(e){return 2==this.state.answers.length?void this.props.showConfirm({type:"ok",title:"You must have at least 2 answer fields."}):void this.setState(function(t){var n=t.answers.slice();return n.splice(e,1),{answers:n}})}},{key:"correctSelected",value:function(e){this.setState({correct:e})}},{key:"imageSelected",value:function(e){var t=this;if(e.target.files&&e.target.files[0]){var n=new FileReader;n.onload=function(e){var n=e.target.result;n.startsWith("data:image")?t.setState({image:n,image_id:null}):t.props.showConfirm({type:"ok",title:"Invalid image file"})},n.readAsDataURL(e.target.files[0])}else this.setState({image:null,image_id:null})}},{key:"clearImage",value:function(){this.setState({image:null,image_id:null})}},{key:"submitQuestion",value:function(){var e=this,t=this.state.title.trim();if(!t)return void this.props.showConfirm({type:"ok",title:"Question title cannot be empty."});var n=this.state.answers.map(function(e){return e.trim()});if(n.findIndex(function(e){return!e})!=-1)return void this.props.showConfirm({type:"ok",title:"Cannot have a blank answer field."});var s=function(t){t?e.props.showConfirm({type:"ok",title:"Error submitting question: "+t}):e.props.hideQuestionEditor()},i=function(t,i){t?e.props.showConfirm({type:"ok",title:"Error uploading image: "+t}):e.state.id?p.default.send("update_question",{id:e.state.id,name:e.state.title,answers:n,correct:String(e.state.correct),image_id:i,tags:e.state.tags},s):p.default.send("create_question",{name:e.state.title,answers:n,correct:String(e.state.correct),image_id:i,tags:e.state.tags},s)};this.state.image&&!this.state.image_id?p.default.send("create_resource",this.state.image,i):i(null,this.state.image_id)}},{key:"changeTag",value:function(e){this.setState({tag:e.target.value})}},{key:"addTag",value:function(){var e=this;this.state.tag&&this.setState(function(t){var n=t.tags.slice();return n.push(e.state.tag),{tags:n,tag:""}})}},{key:"render",value:function(){var e=this;return c.default.createElement("div",{id:"question-creator"},c.default.createElement("label",{className:"question-creator-row"},c.default.createElement("span",{className:"question-creator-title"},"Question: "),c.default.createElement("input",{type:"text",value:this.state.title,size:"75",onChange:this.changeTitle.bind(this)
})),c.default.createElement("ol",{className:"answer-list"},this.state.answers.map(function(t,n){return c.default.createElement("li",{key:n,className:"answer"},c.default.createElement("input",{type:"text",value:t,size:"35",onChange:e.changeAnswer.bind(e,n)}),c.default.createElement("input",{type:"radio",name:"correct",checked:e.state.correct==n,onChange:e.correctSelected.bind(e,n)}),"Correct",c.default.createElement("button",{className:"remove-answer-button",onClick:e.removeAnswer.bind(e,n)},"✖"))})),c.default.createElement("div",{className:"question-creator-row"},c.default.createElement("button",{onClick:this.addAnswer.bind(this)},"Add answer")),c.default.createElement("div",{className:"question-creator-row"},c.default.createElement("input",{type:"file",onChange:this.imageSelected.bind(this)}),this.state.image&&c.default.createElement("input",{className:"option-button",type:"button",value:"Clear image",onClick:this.clearImage.bind(this)})),this.state.image&&c.default.createElement("div",{className:"question-creator-row"},c.default.createElement("img",{id:"image-input",src:this.state.image})),c.default.createElement("div",{className:"question-creator-row"},c.default.createElement("b",null,"Tags:"),c.default.createElement("ol",null,this.state.tags.map(function(t,n){return c.default.createElement("li",{key:n},e.state.tags[n])})),c.default.createElement("input",{type:"text",size:"15",value:this.state.tag,onChange:this.changeTag.bind(this),onKeyPress:function(t){return"Enter"===t.key&&e.addTag()}}),c.default.createElement("button",{className:"add-tag-button",onClick:this.addTag.bind(this)},"Add Tag")),c.default.createElement("div",{className:"question-creator-row"},c.default.createElement("button",{className:"option-button",onClick:this.submitQuestion.bind(this)},this.state.id?"Update":"Submit")))}}]),t}(c.default.Component),L=function(e){function t(){return i(this,t),a(this,(t.__proto__||Object.getPrototypeOf(t)).apply(this,arguments))}return r(t,e),u(t,[{key:"deleteQuestion",value:function(e){var t=this;this.props.showConfirm({type:"yesno",title:"Are you sure you want to delete this question?",onAction:function(n){n&&p.default.send("delete_question",e,function(e,n){e&&t.props.showConfirm({type:"ok",title:e})})}})}},{key:"onDragStart",value:function(e,t){t.dataTransfer.setData("question-id",e)}},{key:"render",value:function(){var e=this;return c.default.createElement("ul",{id:"question-list"},Object.keys(this.props.questions).map(function(t){return c.default.createElement(j,{key:t,question:e.props.questions[t],getResource:e.props.getResource,draggable:!0,onDragStart:e.onDragStart.bind(e,t)},c.default.createElement("button",{className:"delete-button",onClick:function(){return e.deleteQuestion(t)}},"✖"),c.default.createElement("button",{className:"edit-button",onClick:function(){return e.props.chooseQuestion(t)}},"E"))}))}}]),t}(c.default.Component),j=function(e){function t(e){i(this,t);var n=a(this,(t.__proto__||Object.getPrototypeOf(t)).call(this,e));return n.state={image:null},n}return r(t,e),u(t,[{key:"componentWillMount",value:function(){var e=this;this.props.question.image_id&&!this.state.image&&this.props.getResource(this.props.question.image_id,function(t,n){return!e.didUnmount&&e.setState({image:n})})}},{key:"componentWillUnmount",value:function(){this.didUnmount=!0}},{key:"render",value:function(){var e=this;return this.props.question?c.default.createElement("li",{"data-id":this.props.question.id,className:"question"+(this.props.draggable?" draggable":"")+(this.props.draggedOver?" drag-over":""),draggable:this.props.draggable,onDragStart:this.props.onDragStart},c.default.createElement("div",{className:"question-body",style:this.state.image||this.props.question.image_id?{width:"70%"}:{}},c.default.createElement("p",{className:"question-name"},(0,m.unescapeHTML)(this.props.question.name)),c.default.createElement("ol",{className:"answer-list"},this.props.question.answers.map(function(t,n){return c.default.createElement("li",{key:t+n,className:"answer"},c.default.createElement("input",{type:"radio",value:n,readOnly:!0,checked:e.props.question.correct==n}),(0,m.unescapeHTML)(t))}))),this.state.image?c.default.createElement("img",{className:"question-image",src:this.state.image}):this.props.question.image_id&&c.default.createElement("p",{className:"question-image"},"Loading image"),this.props.children):null}}]),t}(c.default.Component),T=function(e){function t(e){function n(e){return e.map(function(e){return"string"==typeof e?{name:e}:{name:e.name,isOpen:!1,children:n(e.children)}})}i(this,t);var s=a(this,(t.__proto__||Object.getPrototypeOf(t)).call(this,e));return s.state={hierarchy:n(e.tags)},s}return r(t,e),u(t,[{key:"recursivelyOpen",value:function(e){var t=this,n=[];return e.map(function(e,s){if(e.children&&e.children.length>0){var i=[c.default.createElement("li",{className:"parent-node tree-node",key:e.name+e.id,onClick:function(){return t.openParentNode(e)}},e.name)];e.isOpen&&(i=i.concat(t.recursivelyOpen(e.children))),n.push(c.default.createElement("ul",{key:e.name+s,className:"parent-holder"},i))}else n.push(c.default.createElement("li",{className:"leaf-node tree-node",key:e.name+e.id,onClick:function(){return t.openLeafNode(e)}},e.name))}),n}},{key:"openParentNode",value:function(e){e.isOpen=!e.isOpen,this.forceUpdate()}},{key:"openLeafNode",value:function(e){console.log("clicked "+e.name)}},{key:"render",value:function(){return c.default.createElement("ul",{className:"outer-tree"},this.recursivelyOpen(this.state.hierarchy))}}]),t}(c.default.Component)}},[391]);