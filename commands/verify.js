const { prefix } = require('../config/options.json');
const { Agent } = require('https');
const fetch = require('node-fetch');
const db_handler = require('../lib/db');

const DIRECTORY_URL = 'https://directory.utk.edu/autocomplete?term=';
const STUDENT_ROLE_ID = '867548620366807041';

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

function delete_code(discord_id) {
  const codes_db = db_handler.getDb('auth_codes');
  const codes_array = codes_db.get('codes') || [];

  const code_idx = codes_array.findIndex(el => el.discord_id == discord_id);
  const netid = codes_array[code_idx].netid;
  codes_array.splice(code_idx, 1);

  codes_db.set('codes', codes_array);
  codes_db.save();

  return netid;
}

function add_user(discord_id, netid) {
  const users_db = db_handler.getDb('users');
  const users_array = users_db.get('users') || [];

  const entry = {
    discord_id,
    netid,
    date_joined: new Date().toString(),
  };

  users_array.push(entry);

  users_db.set('users', users_array);
  users_db.save();
}

async function post_verify(message, code_entry) {
  let error = false;

  await message.member.setNickname(code_entry.name, 'Authenticated via bot').then(null, (reason) => {
    console.error(reason);
    error = 'Nickname could not be set.';
  });

  await message.member.roles.add(STUDENT_ROLE_ID, 'Authenticated via bot').then(null, reason => {
    console.error(reason);
    error = 'Role could not be added.';
  });

  if (typeof error === 'string') {
    return error;
  }

  const netid = delete_code(code_entry.discord_id);
  add_user(code_entry.discord_id, netid);

  message.channel.send(`**Success!** Welcome to Stat Nation ${message.member}!`);
}

module.exports = {
  name: 'verify',
  usage: 'verify <code>',
  description: 'Verify your Discord account',
  canExecute(user) {
    const users_db = db_handler.getDb('users');
    const users_array = users_db.get('users') || [];
    const discord_id = user.id;

    if (users_array.find(entry => entry.discord_id == discord_id)) {
      return 'You are already verified on this server!';
    }
  },
  async execute(command, args) {
    if (args.length != 1) {
      return false;
    }
    const user_id = command.member.id;
    const codes_db = db_handler.getDb('auth_codes');
    const codes_array = codes_db.get('codes') || [];
    const code = args[0];

    const entry = codes_array.find(el => el.discord_id == user_id);

    if (!entry) {
      return `You have not authenticated your Discord account in this server. See the command \`${prefix}auth\`.`;
    }

    if (code != entry.code) {
      return `The verification code you entered does not match the one sent to your email.`;
    }

    return await post_verify(command, entry);
  }
}