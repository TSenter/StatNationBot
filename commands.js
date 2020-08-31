const lib = require('./lib.js');

const STUDENT_ROLE_ID = '749798762527850599';

module.exports = {
  auth_user(args, message) {
    if (args.length === 0 || !args[0]) {
      message.channel.send('**Usage:** `?auth netid`');
      return false;
    }

    const channel = message.channel;
    const member = message.member;

    // Check if user is verified
    if (member.roles.cache.find(role => role.id === STUDENT_ROLE_ID)) {
      channel.send('**Error:** You are already verified!');
      return false;
    }

    // Check if netID is already used

    const netId = args[0];
    lib.directory_lookup(netId, channel, message.author.id).then(
      async name => {
        if (name === false) {
          return;
        }

        const ret = await member.setNickname(name).then(() => true, err => {
          console.log(err);
          return false;
        });
        if (!ret) {
          return false;
        }
        const role = message.guild.roles.resolveID(STUDENT_ROLE_ID);

        message.channel.send(`\`${netId}\` added to <@${member.id}>. Welcome **${name}**!`);
        message.member.roles.add(role);
      }, err => {
        console.log(err);
        channel.send('**Error:** An unexpected error occurred');

        return false;
      }
    );
  }
}