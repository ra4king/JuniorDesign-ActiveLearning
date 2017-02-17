class TestForm extends React.Component {
    render() {
        return (
            <form>
                {this.props.entries.map(function(name) {
                    return (<div><label>{name}</label><input type='text' name={name} /></div>);
                })}
                <input type='submit' value='Submit' />
            </form>
        );
    }
}

ReactDOM.render(<TestForm entries={['Hello', 'World', 'What', 'Is', 'This']} />, document.getElementById('admin-body'));
