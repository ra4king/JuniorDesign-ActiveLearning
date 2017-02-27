'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var SettingsPanels = function (_React$Component) {
    _inherits(SettingsPanels, _React$Component);

    function SettingsPanels(props) {
        _classCallCheck(this, SettingsPanels);

        var _this = _possibleConstructorReturn(this, (SettingsPanels.__proto__ || Object.getPrototypeOf(SettingsPanels)).call(this, props));

        _this.state = {
            users: [],
            selectedUser: null
        };

        if (socket.isLoggedIn()) {
            _this.getUsers();
        } else {
            socket.on('login', _this.getUsers.bind(_this));
        }
        return _this;
    }

    _createClass(SettingsPanels, [{
        key: 'getUsers',
        value: function getUsers() {
            var _this2 = this;

            socket.send('get_users', function (err, users) {
                if (err) {
                    console.error('Error getting users: ' + err);
                } else {
                    _this2.setState({ users: users });
                }
            });
        }
    }, {
        key: 'selectUser',
        value: function selectUser(user) {
            this.setState({ selectedUser: user });
        }
    }, {
        key: 'render',
        value: function render() {
            return React.createElement(
                'div',
                null,
                React.createElement(StudentPanel, { users: this.state.users, selectUser: this.selectUser.bind(this) }),
                React.createElement(PermissionPanel, { users: this.state.users, selectedUser: this.state.selectedUser })
            );
        }
    }]);

    return SettingsPanels;
}(React.Component);

var StudentPanel = function (_React$Component2) {
    _inherits(StudentPanel, _React$Component2);

    function StudentPanel(props) {
        _classCallCheck(this, StudentPanel);

        var _this3 = _possibleConstructorReturn(this, (StudentPanel.__proto__ || Object.getPrototypeOf(StudentPanel)).call(this, props));

        _this3.state = {
            showStudents: true
        };
        return _this3;
    }

    _createClass(StudentPanel, [{
        key: 'showStudents',
        value: function showStudents() {
            this.setState({ showStudents: true });
        }
    }, {
        key: 'showTAs',
        value: function showTAs() {
            this.setState({ showStudents: false });
        }
    }, {
        key: 'render',
        value: function render() {
            var _this4 = this;

            return React.createElement(
                'div',
                { className: 'panel', id: 'student-panel' },
                React.createElement(
                    'ul',
                    { className: 'tab' },
                    React.createElement(
                        'li',
                        null,
                        React.createElement(
                            'a',
                            { href: '#', className: 'tablinks' + (this.state.showStudents ? ' active' : ''), onClick: this.showStudents.bind(this) },
                            'Students'
                        )
                    ),
                    React.createElement(
                        'li',
                        null,
                        React.createElement(
                            'a',
                            { href: '#', className: 'tablinks' + (this.state.showStudents ? '' : ' active'), onClick: this.showTAs.bind(this) },
                            'TAs'
                        )
                    )
                ),
                this.state.showStudents ? React.createElement(
                    'table',
                    { className: 'sortable tabcontent', id: 'student-list' },
                    React.createElement(
                        'thead',
                        null,
                        React.createElement(
                            'tr',
                            null,
                            React.createElement(
                                'th',
                                null,
                                'Users'
                            )
                        )
                    ),
                    React.createElement(
                        'tbody',
                        { id: 'student-buttons' },
                        this.props.users.map(function (user) {
                            return React.createElement(
                                'tr',
                                { key: user.username },
                                React.createElement(
                                    'td',
                                    null,
                                    React.createElement(
                                        'button',
                                        { className: 'list-button', onClick: function onClick() {
                                                return _this4.props.selectUser(user);
                                            } },
                                        unescapeHTML(user.username)
                                    )
                                )
                            );
                        })
                    )
                ) : React.createElement(
                    'table',
                    { className: 'sortable tabcontent', id: 'ta-list' },
                    React.createElement(
                        'thead',
                        null,
                        React.createElement(
                            'tr',
                            null,
                            React.createElement(
                                'th',
                                null,
                                'Teaching Assistants'
                            )
                        )
                    ),
                    React.createElement('tbody', { id: 'ta-buttons' })
                )
            );
        }
    }]);

    return StudentPanel;
}(React.Component);

var PermissionPanel = function (_React$Component3) {
    _inherits(PermissionPanel, _React$Component3);

    function PermissionPanel() {
        _classCallCheck(this, PermissionPanel);

        return _possibleConstructorReturn(this, (PermissionPanel.__proto__ || Object.getPrototypeOf(PermissionPanel)).apply(this, arguments));
    }

    _createClass(PermissionPanel, [{
        key: 'render',
        value: function render() {
            return React.createElement(
                'div',
                { className: 'panel', id: 'permission-panel' },
                React.createElement(
                    'p',
                    null,
                    this.props.selectedUser ? 'Selected ' + unescapeHTML(this.props.selectedUser.username) + '.' : 'Select a user from the side panel.'
                ),
                React.createElement(
                    'p',
                    null,
                    'What else are we going to put here?'
                ),
                React.createElement(
                    'button',
                    { id: 'make-ta-button' },
                    'Make a TA'
                )
            );
        }
    }]);

    return PermissionPanel;
}(React.Component);