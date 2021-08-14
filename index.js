const { Client, Collection } = require('discord.js');
const fs = require('fs');
const { discord_token } = require('./config/security.json');
const { prefix, commands, listeners } = require('./config/options.json');

const client = new Client();

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);

  const installedListeners = fs.readdirSync('./listeners');

  listeners.forEach(item => {
    const isInstalled = installedListeners.includes(`${item}.js`);

    if (!isInstalled) {
      console.error(`Listener "${item}" could not be found. Is it installed in the "listeners" directory? Skipping...`);
      return;
    }

    const listener = require(`./listeners/${item}.js`);

    client.on(listener.event, listener.execute);
  });
  
});

// Read in commands
client.commands = new Collection();
const installedCommands = fs.readdirSync('./commands');

commands.forEach(item => {
  const isInstalled = installedCommands.includes(`${item}.js`);

  if (!isInstalled) {
    console.error(`Command "${item}" could not be found. Is it installed in the "commands" directory? Skipping...`);
    return;
  }

  const command = require(`./commands/${item}.js`);

  client.commands.set(command.name, command);
});

client.on('message', async message => {
  if (!message.content.startsWith(prefix) || message.author.bot) return;

  if (message.channel.id != '805084283030339616') return;

	const args = message.content.slice(prefix.length).trim().split(/ +/);
  const cmd = args.shift().toLowerCase();
  let command;

  try {
    command = client.commands.get(cmd);

    const hasPermission = command.canExecute(message.member);

    if (typeof hasPermission === 'string') {
      message.channel.send(hasPermission);
      return;
    }

    const result = await command.execute(message, args);

    if (result === false) {
      message.channel.send(`**Usage:** \`${prefix}${command.usage}\``);
    } else if (typeof result === 'string') {
      message.channel.send(`**Error:** ${result}`);
    }
  } catch (e) {
    console.error(e);
    return;
  }
});

client.login(discord_token);