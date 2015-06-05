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

client.addListener('error', function(m) {
  console.error('Error: %s: %s', m.command, m.args.join(' '));
});

client.addListener('message', function(f, t, m) {
  
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
  
});