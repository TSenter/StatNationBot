const config = require('../config/thanks.json');

module.exports = {
  name: 'Thanks',
  description: 'Listen for users to thank another user',
  event: 'message',
  execute(message) {
    if (message.author.bot) return;

    const content = message.content;
    const mentions = message.mentions;
    const identifers = config.identifiers;

    const hasIdentifier = identifers.some(identifier => content.toLowerCase().includes(identifier));
    const hasMention = mentions.members.size > 0;

    if (!hasIdentifier || !hasMention) return;

    // Checking to make sure members were mentioned
    if (mentions.everyone) {
      message.channel.send('**Error:** You cannot thank everyone!');
      return;
    }
    if (mentions.roles.size) {
      message.channel.send('**Error:** You cannot thank a role!');
      return;
    }

    // Checking to make sure the user didn't thank themself
    if (mentions.members.some(member => member.id == message.author.id)) {
      message.channel.send('**Error:** You cannot thank yourself!');
      return;
    }

    // Store mentions
    mentions.members.forEach(member => {
      // TODO Log users' "thanks" points
    });

    message.react('✅').catch(console.error);
  }
}