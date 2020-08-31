const fs = require('fs');

module.exports = {
  token: fs.readFileSync('./token.dat').toString().replace(/\n$/, ''),

  command: {
    regex: /^\?([a-z]+)/,
    text:  '?<cmd> [options]'
  }
}