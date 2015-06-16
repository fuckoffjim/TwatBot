/**
 * TwatBot
 *
 * @Dependencies: irc, twit
 *
 * @Author: Jim Rastlerton
 * 
 * twat.pl on crack in nodejs - bot to stalk people on irc and tweet everything they say
 */

// EDIT DIS SHIT
var config = {
  server: 'irc.rizon.net',
  nick: 'twatface',
  master: 'jim',
  commandIdentifer: '!',
  logAll: true, // Logs what everyone says. (will ignore specific nicks)
  ignore: ['jim'], // These are not twats, ignore them if they speak
  twats: ['LulzyDouchebag'], // specific twats to tweet if logAll is false
  min_message: 3, // Minimum length that a message has to be to tweet
  twitter: {
    consumer_key: '',
    consumer_secret: '',
    access_token: '',
    access_token_secret: ''
  },
  connection: {
    port: 6667,
    channels: ['#twattest'],
    userName: 'twat', // ident
    realName: 'Twat Face',
    debug: true,
    secure: false,
    selfSigned: true,
    certExpired: true,
    stripColors: true
  }
};


// FUCK OFF FROM HERE BELOW
var irc = require('irc'),
    twit = require('twit'),
    client = new irc.Client(config.server, config.nick, config.connection),
    twitter = new twit(config.twitter),
    urlRegex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;

function parseCommand(msg) {
  if (msg[0] === config.commandIdentifer) {
    var params = msg.split(" "),
        command = params[0].slice(1),
        comObj = { command: command };
    params.shift();
    comObj.params = params;
    return comObj;
  }
  else {
    return false;
  }
}

function remove(a, s) {
  
  if (a.indexOf(s) !== -1) {
    a.splice(a.indexOf(s), 1);
  }
  else {
    return false;
  }
  
  return a;
}

client.addListener('error', function(m) {
  console.error('Error: %s: %s', m.command, m.args.join(' '));
});

client.addListener('message', function(f, t, m) {
  var com = parseCommand(m);
  
  // If it is a command from either master or an allowed user
  if (com && (f === config.master || config.users.indexOf(f) !== -1)) {
    
    var who;
    
    // commands the master or users are allowed to do.
    if (f === config.master || config.users.indexOf(f) !== -1) {
      
      // !ignore [who] - Adds someone to the ignore list
      if (com.command === 'ignore') {
        who = com.params[0];
        
        if (who in client.chans[t].users && config.ignore.indexOf(who) === -1) {
          config.ignore.push(who);
          
          client.say(t, 'Ignored: '+who);
          
          if (config.connection.debug) {
            console.log('Ignore List: '+config.ignore.join(', '));
          }
          
        }
        
      }
      
      // !unignore [who] - Removes someone from the ignore list
      if (com.command === 'unignore') {
        who = com.params[0];
        
        if (who in client.chans[t].users) {
          
          if (remove(config.ignore, who)) {
            
            client.say(t, 'Unignored: '+who);
            
            if (config.connection.debug) {
              console.log('Ignore List: '+config.ignore.join(', '));
            }
          
          }
          
        }
        
      }
      
      // !addtwat [who] - Adds a twat
      if (com.command === 'addtwat') {
        who = com.params[0];
        
        if (who in client.chans[t].users && config.twats.indexOf(who) === -1) {
          config.twats.push(who);
          
          client.say(t, 'Added Twat: '+who);
          
          if (config.connection.debug) {
            console.log('Twat List: '+config.twats.join(', '));
          }
          
        }
        
      }
      
      // !rmtwat [who] - Removes a twat
      if (com.command === 'rmtwat') {
        who = com.params[0];
        
        if (who in client.chans[t].users) {
          
          if (remove(config.twats, who)) {
            
            client.say(t, 'Removed Twat: '+who);
            
            if (config.connection.debug) {
              console.log('Twat List: '+config.twats.join(', '));
            }
          
          }
          
        }
        
      }
      
    }
    
    // commands only the master can use
    if (f === config.master) {
      
      // !adduser [who] - adds a nick that can use non-master commands
      if (com.command === 'adduser') {
        who = com.params[0];
        
        if (who in client.chans[t].users && config.users.indexOf(who) === -1) {
          config.users.push(who);
          
          client.say(t, 'Added User: '+who);
          
          if (config.connection.debug) {
            console.log('Users: '+config.users.join(', '));
          }
          
        }
        
      }
      
      // !rmuser [who] - removes a nick from config.users
      if (com.command === 'rmuser') {
        who = com.params[0];
        
        if (who in client.chans[t].users) {
          
          if (remove(config.users, who)) {
            
            client.say(t, 'Removed User: '+who);
            
            if (config.connection.debug) {
              console.log('Users: '+config.users.join(', '));
            }
            
          }
          
        }
        
      }
      
    }
    
  }
  else {
    
    // replace @twitter handles (just in case any twat catches on)
    m = m.replace(/@/gi,'');
    
    // Only if the message was to a channel and doesn't contain a url (no cp)
    if (t.match(/^#/) && m.match(urlRegex) == null) {
      
      // skip messages longer than 140 chars and shorter than the min_message
      if (m.length >= config.min_message && m.length <= 140) {
        
        // Log all shit said
        if (config.logAll) {
          
          // If the person isn't in the ignore list, tweet that shit.
          if (config.ignore.indexOf(f) === -1) {
            twitter.post('statuses/update', { status: m }, function(err, data, res) {
              if (err) {
                console.error(err);
              }
              else {
                console.log('Tweeted: '+m+' - '+f);
              }
            });
          }
          
        }
        else {
          
          // Log something one of the twats said. Be sure to ignore our list
          if (config.twats.indexOf(f) !== -1 && config.ignore.indexOf(f) === -1) {
            twitter.post('statuses/update', { status: m }, function(err, data, res) {
              if (err) {
                console.error(err);
              }
              else {
                console.log('Tweeted: '+m+' - '+f);
              }
            });
          }
          
        }
        
      }
      
    }
    else {
      console.log('Discarded Possible URL: '+m);
    }
    
  }
  
});