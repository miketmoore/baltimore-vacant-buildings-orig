var React = require('react');
var Link = require('react-router-component').Link;

module.exports = React.createClass ({
    getDefaultProps () {
        return {
            title: ''
        };
    },
    render () {
        return (
            <nav className="navbar navbar-default navbar-fixed-top">
                <div className="container">
                    <div className="navbar-header">
                        <a className="navbar-brand" href="#">{this.props.title}</a>
                    </div>
                    <div className="collapse navbar-collapse" id="bs-example-navbar-collapse-1">
                        <ul className="nav navbar-nav">
                            <li><Link href="/">Home</Link></li>
                            <li><Link href="/about">About</Link></li>
                        </ul>
                    </div>
                </div>
            </nav>
        )
    }
});
