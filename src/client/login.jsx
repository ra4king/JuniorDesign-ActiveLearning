import React from 'react';
import ReactDOM from 'react-dom';

window.onload = () => {
    ReactDOM.render(<LoginPage />, document.getElementById('login'));
}

class LoginPage extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            register: register,
            username: username
        };
    }

    showLogin() {
        this.setState({ register: false });
    }

    showRegister() {
        this.setState({ register: true });
    }

    editUsername(e) {
        this.setState({ username: e.target.value });
    }

    render() {
        return (
            <div>
                <img id='logo' src='images/active_learning_logo_black.png' alt='logo'/>
                <h1>Active Learning Tool</h1>

                <div className='login-wrapper'>
                    <ul className='tab'>
                        <li>
                            <a href='#' className={'tablinks' + (this.state.register ? '' : ' active')} onClick={this.showLogin.bind(this)}>
                                Login
                            </a>
                        </li>
                        <li>
                            <a href='#' className={'tablinks' + (this.state.register ? ' active' : '')} onClick={this.showRegister.bind(this)}>
                                Register
                            </a>
                        </li>
                    </ul>

                    {message && (<p id='message'>{message}</p>)}

                    {this.state.register
                        ? (<RegisterTab username={this.state.username} editUsername={this.editUsername.bind(this)} />)
                        : (<LoginTab username={this.state.username} editUsername={this.editUsername.bind(this)} />)}
                </div>
            </div>
        );
    }
}

class LoginTab extends React.Component {
    render() {
        return (
            <form method='post'>
                <input type='hidden' name='_csrf' value={csurf} />
                <input type='text' className='text' name='username' value={this.props.username} placeholder='Username' onChange={this.props.editUsername} />
                <input type='password' className='text' name='password' placeholder='Password' />
                <input type='submit' className='login' value='Login' formAction={'api/login?redirect=' + redirect} />
            </form>
        );
    }
}

class RegisterTab extends React.Component {
    render() {
        return (
            <form method='post'>
                <input type='hidden' name='_csrf' value={csurf} />
                <input type='text' className='text' name='username' value={this.props.username} placeholder='Username' onChange={this.props.editUsername} />
                <input type='password' className='text' name='password' placeholder='Password' />
                <input type='password' className='text' name='password' placeholder='Retype Password' />
                <input type='submit' className='login' value='Register' formAction='api/register' />
            </form>
        );
    }
}
