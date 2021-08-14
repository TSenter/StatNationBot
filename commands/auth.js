const { Agent } = require('https');
const fetch = require('node-fetch');
const { prefix } = require('../config/options.json');
const email_handler = require('@sendgrid/mail');
const { sendgrid_email, sendgrid_api_key } = require('../config/security.json');
const db_handler = require('../lib/db');

const DIRECTORY_URL = 'https://directory.utk.edu/autocomplete?term=';

email_handler.setApiKey(sendgrid_api_key);

function directory_lookup(netid) {
  const agent = new Agent({
    rejectUnauthorized: false,
  });

  return fetch(`${DIRECTORY_URL}${netid}`, {
    agent
  })
    .then(response => response.json(), () => false)
    .then(results => {
      let found = false, student;

      for (student of results) {
        if (student.label.includes(` ${netid}@`)) {
          found = true;
          break;
        }
      }

      if (!found) {
        return `This is not a valid netID: \`${netid}\`!`;
      }

      if (!student.label.includes('student')) {
        return `This is not a student netID: \`${netid}\`!`;
      }

      const full_name = student.value;
      let name = full_name.split(', ');
      name = name[1] + ' ' + name[0];
      name = name.split(' ');
      name = name[0] + ' ' + name[name.length - 1];

      return {
        name,
        email: `${netid}@vols.utk.edu`,
      }
    });
}

function send_verification_email(discord_id, netid, name) {
  const code = generate_verify_code(discord_id, netid, name);

  const msg = {
    to: `${netid}@vols.utk.edu`,
    from: sendgrid_email,
    subject: 'Verify Your Discord Account | StatNation',
    html: `Your StatNation verification code is <strong>${code}</strong>. Use the command <code>${prefix}verify ${code}</code> to verify your Discord account.`
  };

  return email_handler.send(msg);
}

function delete_code(discord_id) {
  const codes_db = db_handler.getDb('auth_codes');
  const codes_array = codes_db.get('codes') || [];

  const code_idx = codes_array.findIndex(el => el.discord_id == discord_id);

  if (code_idx == -1) {
    return;
  }

  codes_array.splice(code_idx, 1);

  codes_db.set('codes', codes_array);
  codes_db.save();
}

function generate_verify_code(discord_id, netid, name) {
  delete_code(discord_id);

  const code = (Math.floor(Math.random() * 1000000)).toString().padStart(6, '0');
  const code_db = db_handler.getDb('auth_codes');
  const codes_array = code_db.get('codes') || [];

  const array_entry = {
    discord_id,
    code,
    netid,
    name,
  };

  codes_array.push(array_entry);

  code_db.set('codes', codes_array);
  code_db.save();

  return code;
}

module.exports = {
  name: 'auth',
  usage: 'auth <netid>',
  description: 'Begin the authentication process through UT',
  canExecute(user) {
    // if (user.roles.cache.has('715556594225774665')) {
    //   return 'You cannot authenticate as a student in this server!';
    // }
    if (user.roles.cache.has('805092251868594186')) {
      return 'You are already authenticated in this server!';
    }
    return true;
  },
  async execute(message, args) {
    if (args.length !== 1) {
      return false;
    }
    const netid = args[0];

    const student = await directory_lookup(netid);

    if (typeof student === 'string') {
      return student;
    } else if (student === false) {
      return 'An error occurred.';
    } else {
      try {
        await send_verification_email(message.member.id, netid, student.name);
        await message.channel.send(`${message.member}, check your UTK email for your verification code.`);
      } catch (e) {
        console.error(e);
        return 'An error occurred when sending the authentication email.';
      }
    }
  }
}