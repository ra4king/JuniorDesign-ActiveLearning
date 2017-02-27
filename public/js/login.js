'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

window.onload = function () {
    ReactDOM.render(React.createElement(LoginPage, null), document.getElementById('login'));
};

var LoginPage = function (_React$Component) {
    _inherits(LoginPage, _React$Component);

    function LoginPage(props) {
        _classCallCheck(this, LoginPage);

        var _this = _possibleConstructorReturn(this, (LoginPage.__proto__ || Object.getPrototypeOf(LoginPage)).call(this, props));

        _this.state = {
            register: register,
            username: username
        };
        return _this;
    }

    _createClass(LoginPage, [{
        key: 'showLogin',
        value: function showLogin() {
            this.setState({ register: false });
        }
    }, {
        key: 'showRegister',
        value: function showRegister() {
            this.setState({ register: true });
        }
    }, {
        key: 'editUsername',
        value: function editUsername(e) {
            this.setState({ username: e.target.value });
        }
    }, {
        key: 'render',
        value: function render() {
            return React.createElement(
                'div',
                null,
                React.createElement('img', { id: 'logo', src: 'images/active_learning_logo_black.png', alt: 'logo' }),
                React.createElement(
                    'h1',
                    null,
                    'Active Learning Tool'
                ),
                React.createElement(
                    'div',
                    { className: 'login-wrapper' },
                    React.createElement(
                        'ul',
                        { className: 'tab' },
                        React.createElement(
                            'li',
                            null,
                            React.createElement(
                                'a',
                                { href: '#', className: 'tablinks' + (this.state.register ? '' : ' active'), onClick: this.showLogin.bind(this) },
                                'Login'
                            )
                        ),
                        React.createElement(
                            'li',
                            null,
                            React.createElement(
                                'a',
                                { href: '#', className: 'tablinks' + (this.state.register ? ' active' : ''), onClick: this.showRegister.bind(this) },
                                'Register'
                            )
                        )
                    ),
                    message && React.createElement(
                        'p',
                        { id: 'message' },
                        message
                    ),
                    this.state.register ? React.createElement(RegisterTab, { username: this.state.username, editUsername: this.editUsername.bind(this) }) : React.createElement(LoginTab, { username: this.state.username, editUsername: this.editUsername.bind(this) })
                )
            );
        }
    }]);

    return LoginPage;
}(React.Component);

var LoginTab = function (_React$Component2) {
    _inherits(LoginTab, _React$Component2);

    function LoginTab() {
        _classCallCheck(this, LoginTab);

        return _possibleConstructorReturn(this, (LoginTab.__proto__ || Object.getPrototypeOf(LoginTab)).apply(this, arguments));
    }

    _createClass(LoginTab, [{
        key: 'render',
        value: function render() {
            return React.createElement(
                'form',
                { method: 'post' },
                React.createElement('input', { type: 'hidden', name: '_csrf', value: csurf }),
                React.createElement('input', { type: 'text', className: 'text', name: 'username', value: this.props.username, placeholder: 'Username', onChange: this.props.editUsername }),
                React.createElement('input', { type: 'password', className: 'text', name: 'password', placeholder: 'Password' }),
                React.createElement('input', { type: 'submit', className: 'login', value: 'Login', formAction: 'api/login?redirect=' + redirect })
            );
        }
    }]);

    return LoginTab;
}(React.Component);

var RegisterTab = function (_React$Component3) {
    _inherits(RegisterTab, _React$Component3);

    function RegisterTab() {
        _classCallCheck(this, RegisterTab);

        return _possibleConstructorReturn(this, (RegisterTab.__proto__ || Object.getPrototypeOf(RegisterTab)).apply(this, arguments));
    }

    _createClass(RegisterTab, [{
        key: 'render',
        value: function render() {
            return React.createElement(
                'form',
                { method: 'post' },
                React.createElement('input', { type: 'hidden', name: '_csrf', value: csurf }),
                React.createElement('input', { type: 'text', className: 'text', name: 'username', value: this.props.username, placeholder: 'Username', onChange: this.props.editUsername }),
                React.createElement('input', { type: 'password', className: 'text', name: 'password', placeholder: 'Password' }),
                React.createElement('input', { type: 'password', className: 'text', name: 'password', placeholder: 'Retype Password' }),
                React.createElement('input', { type: 'submit', className: 'login', value: 'Register', formAction: 'api/register' })
            );
        }
    }]);

    return RegisterTab;
}(React.Component);