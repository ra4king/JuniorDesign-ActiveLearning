webpackJsonp([1],{11:function(e,t,n){"use strict";function i(e){if(null==e)return"";for(var t;(t=decodeURIComponent(e).replace(r,function(e){return s[e]}))!=e;)e=t;return e}function o(e){for(var t=e+"=",n=document.cookie.split(";"),i=0;i<n.length;i++){var o=n[i].trim();if(0==o.indexOf(t))return decodeURIComponent(o.substring(t.length,o.length))}return null}Object.defineProperty(t,"__esModule",{value:!0}),t.unescapeHTML=i,t.readCookie=o;var s={"&apos;":"'","&#39;":"'","&amp;":"&","&gt;":">","&lt;":"<","&quot;":'"'},r=new RegExp("("+Object.keys(s).join("|")+")","g")},19:function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var i=n(11);t.default=new function(){function e(){return null!=t||(alert("No connection to the server. Attemping to reconnect..."),l(),!1)}var t,n=this,o={},s={},r=(0,i.readCookie)("session_id"),u=!1,a=!1,l=function e(){if(null==r)return void console.error("Could not find session_id cookie?!");if(!u){u=!0,console.log("Connecting...");var i=new WebSocket("wss://www.roiatalla.com/active-learning/api");i.onopen=function(){t=i,console.log("Connected to server!"),n.send("login",r,function(e,t){e?console.error("Failed to authenticate to API."):console.log("Successfully logged in."),a=!0,n.emit("login",t)})},i.onmessage=function(e){var t=JSON.parse(e.data);if(s[t.id]){var i=s[t.id];i.callback(t.err,t.data,i.request),delete s[t.id]}else t.err||n.emit(t.id,t.data)},i.onclose=function(){t=null,a=!1,u=!1,console.log("Connection closed."),setTimeout(e,1e3)}}};this.isConnected=function(){return null!=t},this.isLoggedIn=function(){return a},this.on=function(e,t){o[e]=o[e]||[],o[e].push(t)},this.once=function(e,t){var i=function e(i){t(i),n.remove(e)};n.on(e,i)},this.remove=function(e,t){var n=o[e].indexOf(t);n>=0&&o[e].splice(n,1)},this.emit=function(e,t){o[e]&&o[e].forEach(function(e){return e(t)})};var c=0;this.send=function(n,i,o){if(!n)return o("Invalid command");if("function"==typeof i&&(o=i,i=void 0),e()){var r={id:c++,command:n,data:i};t.send(JSON.stringify(r)),o&&"function"==typeof o&&(s[r.id]={request:r,callback:o})}else o&&"function"==typeof o&&o("Not connected")},l()}},227:function(e,t,n){"use strict";function i(e){return e&&e.__esModule?e:{default:e}}function o(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}function s(e,t){if(!e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return!t||"object"!=typeof t&&"function"!=typeof t?e:t}function r(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function, not "+typeof t);e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t)}Object.defineProperty(t,"__esModule",{value:!0});var u=function(){function e(e,t){for(var n=0;n<t.length;n++){var i=t[n];i.enumerable=i.enumerable||!1,i.configurable=!0,"value"in i&&(i.writable=!0),Object.defineProperty(e,i.key,i)}}return function(t,n,i){return n&&e(t.prototype,n),i&&e(t,i),t}}(),a=n(3),l=i(a),c=n(19),f=i(c),d=n(11),p=n(183),h=i(p),m=function(e){function t(e){o(this,t);var n=s(this,(t.__proto__||Object.getPrototypeOf(t)).call(this,e));return n.state={statistics:{}},n.getStats=n.getStats.bind(n),f.default.isLoggedIn()?n.getStats(e.user):f.default.on("login",n.getStats),n}return r(t,e),u(t,[{key:"getStats",value:function(e){var t=this;f.default.send("get_stats",function(n,i){n?console.error("Error getting stats: "+n):t.setState({statistics:i[e.username]})})}},{key:"componentWillUnmount",value:function(){f.default.remove("login",this.getStats)}},{key:"render",value:function(){return l.default.createElement("div",null,l.default.createElement(v,{statistics:this.state.statistics}))}}]),t}(l.default.Component);t.default=m;var v=function(e){function t(){return o(this,t),s(this,(t.__proto__||Object.getPrototypeOf(t)).apply(this,arguments))}return r(t,e),u(t,[{key:"setupChart",value:function(e){this.canvas=this.canvas||e;var t=this.props.statistics,n=[],i=[];for(var o in t){var s=0,r=0;for(var u in t[o].questions){var a=t[o].questions[u];s+=a.score,r+=a.total}n.push((0,d.unescapeHTML)(t[o].name)),i.push(100*(s/r))}var l={labels:n,datasets:[{label:"% correct answers",data:i,backgroundColor:"rgba(100, 129, 237, 0.5)",borderColor:"rgba(200, 200, 200, 1)",borderWidth:2}]};this.chart&&this.chart.destroy(),this.chart=new h.default(this.canvas,{type:"bar",data:l,options:{maintainAspectRatio:!1,scales:{yAxes:[{ticks:{beginAtZero:!0,max:100}}]}}})}},{key:"render",value:function(){return l.default.createElement("div",{id:"statistics-panel"},l.default.createElement("canvas",{ref:this.setupChart.bind(this),id:"statistics-chart"}))}}]),t}(l.default.Component)},392:function(e,t,n){"use strict";function i(e){return e&&e.__esModule?e:{default:e}}function o(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}function s(e,t){if(!e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return!t||"object"!=typeof t&&"function"!=typeof t?e:t}function r(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function, not "+typeof t);e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t)}var u=Object.assign||function(e){for(var t=1;t<arguments.length;t++){var n=arguments[t];for(var i in n)Object.prototype.hasOwnProperty.call(n,i)&&(e[i]=n[i])}return e},a=function(){function e(e,t){for(var n=0;n<t.length;n++){var i=t[n];i.enumerable=i.enumerable||!1,i.configurable=!0,"value"in i&&(i.writable=!0),Object.defineProperty(e,i.key,i)}}return function(t,n,i){return n&&e(t.prototype,n),i&&e(t,i),t}}(),l=n(3),c=i(l),f=n(20),d=i(f),p=n(19),h=i(p),m=n(11),v=n(227),g=i(v),y=n(45);window.onload=function(){d.default.render(c.default.createElement(y.Router,{history:y.browserHistory},c.default.createElement(y.Route,{path:"/active-learning/",component:b},c.default.createElement(y.IndexRoute,{component:w}),c.default.createElement(y.Route,{path:"/active-learning/statistics",component:g.default}))),document.getElementById("panels"))};var b=function(e){function t(e){o(this,t);var n=s(this,(t.__proto__||Object.getPrototypeOf(t)).call(this,e));return n.state={resources:{},questions:{},quizzes:{},showConfirm:null,showLiveQuestion:!1,currentLiveQuestion:null},h.default.on("login",function(e){e&&n.setState({user:e})}),h.default.on("questions",function(e){return n.setState({questions:e})}),h.default.on("quizzes",function(e){return n.setState({quizzes:e})}),h.default.on("live_question",function(e){return n.setState({currentLiveQuestion:e})}),n.refresh=n.refresh.bind(n),h.default.isLoggedIn()?n.refresh():h.default.on("login",n.refresh),n}return r(t,e),a(t,[{key:"refresh",value:function(){h.default.send("get_quizzes",function(e,t){return!e&&h.default.emit("quizzes",t)}),h.default.send("get_questions",function(e,t){return!e&&h.default.emit("questions",t)}),h.default.send("get_live_question",function(e,t){return!e&&h.default.emit("live_question",t)})}},{key:"componentWillUnmount",value:function(){h.default.remove("login",this.refresh)}},{key:"toggleLiveQuiz",value:function(){this.setState({showLiveQuestion:!this.state.showLiveQuestion}),h.default.send("live_question",function(e,t){e?console.error("Error sending request for live question id: "+e):h.default.emit("live_question",t)})}},{key:"showConfirm",value:function(e){this.setState({showConfirm:e})}},{key:"hideConfirm",value:function(){this.setState({showConfirm:null})}},{key:"getResource",value:function(e,t){var n=this;this.state.resources[e]?(t&&t(null,this.state.resources[e]),this.setState({questions:this.state.questions})):h.default.send("get_resource",e,function(i,o){if(i)console.error("Failed to load image for question "+question_id+" with resource id "+e+": "+i),t&&t(i);else{var s=n.state.resources;s[e]=o,t&&t(null,o),n.setState({questions:n.state.questions,resources:s})}})}},{key:"render",value:function(){var e=this;return c.default.createElement("div",null,(this.state.showLiveQuestion||this.state.showConfirm)&&c.default.createElement("div",{id:"overlay"}),this.state.showLiveQuestion&&c.default.createElement(_,{question:this.state.currentLiveQuestion,getResource:this.getResource.bind(this),toggleLiveQuiz:this.toggleLiveQuiz.bind(this)}),this.state.showConfirm&&c.default.createElement(z,u({hideConfirm:function(){return e.hideConfirm()}},this.state.showConfirm)),c.default.createElement("div",{className:(this.state.showLiveQuestion||this.state.showConfirm)&&"blur"},c.default.createElement(q,{user:this.state.user,page:this.state.page}),c.default.Children.map(this.props.children,function(t){return c.default.cloneElement(t,{user:e.state.user,questions:e.state.questions,quizzes:e.state.quizzes,getResource:e.getResource.bind(e),showConfirm:e.showConfirm.bind(e),toggleLiveQuiz:e.toggleLiveQuiz.bind(e)})})))}}]),t}(c.default.Component),q=function(e){function t(){return o(this,t),s(this,(t.__proto__||Object.getPrototypeOf(t)).apply(this,arguments))}return r(t,e),a(t,[{key:"render",value:function(){return c.default.createElement("div",{id:"header-panel"},c.default.createElement("img",{id:"logo",src:"images/active_learning_logo_white.png",width:"175",height:"75",alt:"logo"}),c.default.createElement("h2",{id:"name"},this.props.user?this.props.user.username:""),c.default.createElement("nav",null,c.default.createElement("form",{method:"post"},c.default.createElement("button",{className:"header-nav-link",formAction:"api/logout"},"Logout")),c.default.createElement(y.IndexLink,{to:"/active-learning/statistics",className:"header-nav-link",activeClassName:"selected"},"Statistics"),c.default.createElement(y.IndexLink,{to:"/active-learning/",className:"header-nav-link",activeClassName:"selected"},"Home")))}}]),t}(c.default.Component),_=function(e){function t(){return o(this,t),s(this,(t.__proto__||Object.getPrototypeOf(t)).apply(this,arguments))}return r(t,e),a(t,[{key:"render",value:function(){return c.default.createElement("div",{id:"live-quiz"},this.props.question?c.default.createElement("ul",{id:"live-question"},c.default.createElement(Q,{question:this.props.question,getResource:this.props.getResource})):c.default.createElement("p",{id:"live-question-msg"},"Live question has ended."),c.default.createElement("button",{onClick:this.props.toggleLiveQuiz,className:"delete-button"},"✖"))}}]),t}(c.default.Component),z=function(e){function t(){return o(this,t),s(this,(t.__proto__||Object.getPrototypeOf(t)).apply(this,arguments))}return r(t,e),a(t,[{key:"clicked",value:function(e){this.props.hideConfirm(),this.props.onAction&&this.props.onAction(e)}},{key:"render",value:function(){var e=this;return c.default.createElement("div",{id:"confirm-box"},c.default.createElement("p",{id:"confirm-msg"},this.props.title),"yesno"==this.props.type?c.default.createElement("div",null,c.default.createElement("button",{onClick:function(){return e.clicked(!1)},className:"cancel-button"},this.props.noText||"No"),c.default.createElement("button",{onClick:function(){return e.clicked(!0)},className:"confirm-button"},this.props.yesText||"Yes")):c.default.createElement("button",{onClick:function(){return e.clicked()},id:"ok-button"},this.props.okText||"Ok"))}}]),t}(c.default.Component),w=function(e){function t(e){o(this,t);var n=s(this,(t.__proto__||Object.getPrototypeOf(t)).call(this,e));return n.state={selectedQuiz:null},n}return r(t,e),a(t,[{key:"chooseQuiz",value:function(e){var t=this;e&&this.state.selectedQuiz?this.props.showConfirm({type:"yesno",title:"Discard current quiz?",onAction:function(n){n&&t.setState({selectedQuiz:e})}}):this.setState({selectedQuiz:e})}},{key:"render",value:function(){var e=this;return c.default.createElement("div",null,c.default.createElement(E,{showConfirm:this.props.showConfirm,quizzes:this.props.quizzes,chooseQuiz:this.chooseQuiz.bind(this),toggleLiveQuiz:this.props.toggleLiveQuiz}),c.default.createElement(C,{getResource:this.props.getResource,showConfirm:this.props.showConfirm,hideQuiz:function(){return e.chooseQuiz(null)},questions:this.props.questions,quiz:this.state.selectedQuiz&&this.props.quizzes[this.state.selectedQuiz]}))}}]),t}(c.default.Component),E=function(e){function t(){return o(this,t),s(this,(t.__proto__||Object.getPrototypeOf(t)).apply(this,arguments))}return r(t,e),a(t,[{key:"render",value:function(){return c.default.createElement("div",{id:"quiz-panel"},c.default.createElement("button",{className:"option-button",onClick:this.props.toggleLiveQuiz},"Live Quiz"),c.default.createElement(k,{quizzes:this.props.quizzes,chooseQuiz:this.props.chooseQuiz}))}}]),t}(c.default.Component),k=function(e){function t(){return o(this,t),s(this,(t.__proto__||Object.getPrototypeOf(t)).apply(this,arguments))}return r(t,e),a(t,[{key:"render",value:function(){var e=this;return c.default.createElement("ol",{className:"quiz-list"},Object.keys(this.props.quizzes).map(function(t){var n=e.props.quizzes[t],i=e.props.chooseQuiz.bind(null,t);return c.default.createElement("li",{key:t,id:"quiz-"+t,className:"quiz"},c.default.createElement("button",{className:"quiz-body",onClick:i},(0,m.unescapeHTML)(n.name)))}))}}]),t}(c.default.Component),C=function(e){function t(){return o(this,t),s(this,(t.__proto__||Object.getPrototypeOf(t)).apply(this,arguments))}return r(t,e),a(t,[{key:"render",value:function(){return c.default.createElement("div",{id:"question-panel"},c.default.createElement("h2",{id:"quiz-title"},this.props.quiz?this.props.quiz.name:"Quiz"),this.props.quiz?c.default.createElement(O,{quiz:this.props.quiz,questions:this.props.questions,getResource:this.props.getResource,showConfirm:this.props.showConfirm,hideQuiz:this.props.hideQuiz}):c.default.createElement("p",{id:"choose-quiz-msg"},"Choose a quiz from the left side!"))}}]),t}(c.default.Component),O=function(e){function t(e){o(this,t);var n=s(this,(t.__proto__||Object.getPrototypeOf(t)).call(this,e));return n.answers={},n}return r(t,e),a(t,[{key:"answerSelected",value:function(e,t){this.answers[e]=t}},{key:"submitClicked",value:function(){var e=this,t="Are you sure you want to submit this quiz?",n=Object.keys(this.answers).length,i=this.props.quiz.questions.length;n!=i&&(t+=" You only answered "+n+" of the "+i+" questions."),this.props.showConfirm({type:"yesno",title:t,onAction:function(t){t&&h.default.send("submit_quiz",{quiz_id:e.props.quiz.id,answers:e.answers},function(t,n){e.props.showConfirm({type:"ok",title:t?"Failed to submit, please trying again. Error: "+t:"Your answers have been submitted."}),e.props.hideQuiz()})}})}},{key:"render",value:function(){var e=this;return c.default.createElement("ol",{id:"question-list"},[this.props.quiz.questions.map(function(t){return c.default.createElement(Q,{key:t,getResource:e.props.getResource,question:e.props.questions[t],answerSelected:e.answerSelected.bind(e,t)})}),c.default.createElement("li",{key:"submit-all",className:"submit-all"},c.default.createElement("button",{className:"submit-all-button",onClick:this.submitClicked.bind(this)},"Submit All"))])}}]),t}(c.default.Component),Q=function(e){function t(e){o(this,t);var n=s(this,(t.__proto__||Object.getPrototypeOf(t)).call(this,e));return n.state={image:null},n}return r(t,e),a(t,[{key:"componentWillMount",value:function(){var e=this;this.props.question.image_id&&!this.state.image&&this.props.getResource(this.props.question.image_id,function(t,n){return e.setState({image:n})})}},{key:"answerSelected",value:function(e){this.props.answerSelected(e.target.value)}},{key:"render",value:function(){var e=this;return this.props.question?c.default.createElement("li",{className:"question"},c.default.createElement("div",{className:"question-body",style:this.state.image||this.props.question.image_id?{width:"70%"}:{}},c.default.createElement("p",{className:"question-name"},(0,m.unescapeHTML)(this.props.question.name)),c.default.createElement("ol",{className:"answer-list"},this.props.question.answers.map(function(t,n){return c.default.createElement("li",{key:t+n,className:"answer"},c.default.createElement("input",{type:"radio",name:"answers-"+e.props.question.id,value:n,onChange:e.answerSelected.bind(e)}),(0,m.unescapeHTML)(t))}))),this.state.image?c.default.createElement("img",{className:"question-image",src:this.state.image}):this.props.question.image_id&&c.default.createElement("p",{className:"question-image"},"Loading image")):null}}]),t}(c.default.Component)}},[392]);