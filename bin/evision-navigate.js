var utils = require("utils");
var casper = require('casper').create({
//  verbose: true,
//  logLevel: 'debug',
//  clientScripts: ['lib/jquery-2.1.3.min.js']
});

if (!casper.cli.has('username') || !casper.cli.has('password')) {
  casper.echo('Must provide username and password for eVision.', 'ERROR');
  var calledFile = casper.cli['raw']['args'][0];
  casper.echo('casperjs --username=mm911 --password=hunter2 ' + calledFile, 'ERROR');
  casper.exit();
}

var evision_username = casper.cli.get('username'),
    evision_password = casper.cli.get('password');

casper.start();
casper.userAgent('Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1)');

casper.thenOpen('https://evision.york.ac.uk', function evisionSignIn () {
  var expectedSignInUrl = (this.getCurrentUrl() == 'https://shib.york.ac.uk/idp/Authn/UserPassword');
  casper.echo(this.getCurrentUrl(), expectedSignInUrl ? 'INFO' : 'WARNING');

  this.fill('form[name=login_form]', {
    j_username: evision_username,
    j_password: evision_password
  }, true);
});

casper.then(function () {
  // @TODO: At the time of writing, waitForUrl crashed PhantomJS where my
  // perfectly equivalent check below did not.
  casper.waitFor(function waitForEVisionLoad() {
    return this.evaluate(function() {
      return window.location.href == 'https://evision.york.ac.uk/urd/sits.urd/run/siw_sso.signon';
    });
  });
});

casper.then(function evisionHasLoaded () {
  casper.echo(this.getCurrentUrl(), 'INFO');
});

casper.run();
