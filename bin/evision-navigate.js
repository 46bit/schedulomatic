var utils = require("utils");
var casper = require('casper').create({
//  verbose: true,
//  logLevel: 'debug',
//  clientScripts: ['lib/jquery-2.1.3.min.js']
});

// At the time of writing, CasperJS's waitForUrl crashed PhantomJS whereas the
// trivially obvious check below does not.
// @TODO: File a bug.
casper.waitForUrl = function (url, then, onTimeout, timeout) {
  casper.waitFor(function () {
    var href = casper.evaluate(function () {
      return window.location.href;
    });
    console.log(url, href);
    return url == href;
  }, then, onTimeout, timeout);
};

if (!casper.cli.has('username') || !casper.cli.has('password')) {
  casper.echo('Must provide username and password for eVision.', 'ERROR');
  var calledFile = casper.cli['raw']['args'][0];
  casper.echo('casperjs --username=mm911 --password=hunter2 ' + calledFile, 'ERROR');
  casper.exit();
}

var evision_username = casper.cli.get('username'),
    evision_password = casper.cli.get('password');

var evision_url = 'https://evision.york.ac.uk',
    evision_login_url = 'https://shib.york.ac.uk/idp/Authn/UserPassword',
    evision_signed_in_url = 'https://evision.york.ac.uk/urd/sits.urd/run/siw_sso.signon',
    timetabling_index_url = 'https://www.york.ac.uk/univ/mis/cfm/timetabling/index.cfm',
    timetabling_calendar_url = 'https://www.york.ac.uk/univ/mis/cfm/timetabling/calendarterm.cfm';

casper.start();
casper.userAgent('Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1)');

// SIGN INTO EVISION
casper.thenOpen(evision_url, function evisionSignIn () {
  casper.echo(casper.getCurrentUrl(), 'INFO');

  // Try to sign into eVision.
  casper.fill('form[name=login_form]', {
    j_username: evision_username,
    j_password: evision_password
  }, true);
});

// WAIT FOR EVISION TO LOAD
casper.waitForUrl(evision_signed_in_url, function evisionHasLoaded () {
  casper.echo(casper.getCurrentUrl(), 'INFO');
}, function () {
  casper.echo('eVision did not load. Login credentials may be incorrect.', 'ERROR');
  casper.exit();
}, 15000);

var timetables = {
  'Computer Science': [
    'UBCOMSEMB3/YR3 Computer Science with Embedded Systems Engineering',
    'UMCSESCSE4/YR4 Computer Systems and Software Engineering'
  ],
  'Mathematics': [
    'UBMATASTA3/YR3 Mathematics and Statistics',
    'PMMATSAMB1/YR1 Advanced Mathematical Biology'
  ],
  'Sociology': [
    'UBSOCSSOC3/YR1 Sociology',
    'UBCRISCRI3/YR3 Criminology YR3'
  ]
};

for (department in timetables) {
  var department_routes = timetables[department];
  for (route in department_routes) {
    // SELECT DEPARTMENT.
    casper.thenOpen(timetabling_index_url, function selectDepartment () {
      casper.evaluate(function () {
        // Fields seem to be outside a valid <form>.
        var department_select = document.getElementById('Department_Select');
        department_select.value = department;
        department_select.onchange();
      });
    });

    // SELECT ROUTE.
    casper.waitForUrl(timetabling_index_url, function selectRoute () {
      casper.echo(casper.getCurrentUrl(), 'INFO');
      casper.evaluate(function () {
        var route_select = document.getElementById('Route_Select');
        route_select.value = route.split(' ')[0];
        route_select.parentNode.parentNode.querySelector("input").click();
      });
    });

    // PROCESS CALENDAR.
    casper.waitForUrl(timetabling_calendar_url, function processRouteCalendar () {
      casper.echo(casper.getCurrentUrl(), 'INFO');
      casper.echo(casper.evaluate(function () {
        return document.querySelector("#CurrentlyViewing span").innerText;
      }), 'WARNING');
    });
  }
}

casper.run();
