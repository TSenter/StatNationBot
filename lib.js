const https = require('https');
const fetch = require('node-fetch');

module.exports = {
  directory_lookup(netId, channel, discord_id) {

    // This is a temporary and dirty hack
    const agent = new https.Agent({
      rejectUnauthorized: false
    });

    const promise = fetch(`https://directory.utk.edu/autocomplete?term=${netId}`, {
      agent
    })
    .then(response => response.json(), () => false)
    .then(results => {
      let found = false, student;

      for (student of results) {
        if (student.label.includes(` ${netId}@`)) { // We have an exact match
          found = student;
          break;
        }
      }

      if (found === false) {
        channel.send(`**Error:** Invalid netID: "${netId}"`);
        return false;
      }

      if (!found.label.includes('student')) {
        channel.send(`Hey <@${discord_id}>, this is not a "student" netID.`);
        return false;
      }

      let full_name = found.value;
      let fixed_name = full_name.split(', ');

      fixed_name = fixed_name[1] + ' ' + fixed_name[0];
      fixed_name = fixed_name.split(' ');
      fixed_name = fixed_name[0] + ' ' + fixed_name[fixed_name.length - 1];

      return fixed_name;
    }, err => {
      console.log(err);
      channel.send('**Error:** An unexpected error occurred');
      return false;
    });

    return promise;
  },

  rand_str(pool, length) {
    let str = '';

    for (let i = 0; i < length; i++) {
      str += pool[Math.floor(Math.random() * pool.length)];
    }

    return str;
  }
}