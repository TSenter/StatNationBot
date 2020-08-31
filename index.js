const config = require('./config.js');
const pkg = require('./package.json');
const commands = require('./commands.js');

const Discord = require('discord.js');
const client = new Discord.Client();

console.log(pkg.name + ' (v' + pkg.version + ')');
console.log();

client.on('ready', () => {
  console.log('Started up successfully...');
});

client.on('message', async message => {
  if (message.channel.id == '732686303392432168') {
    if (config.command.regex.test(message.content)) {
      parse(message);
    }
  }
});

client.login(config.token);

function parse(message) {
  const array = config.command.regex.exec(message.content);
  let args = message.content.substring(array[0].length + 1);
  args = args.split(' ');

  if (array[1] == 'auth') {
    commands.auth_user(args, message);
  }
}