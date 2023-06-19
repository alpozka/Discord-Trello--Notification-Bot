const Discord = require("discord.js");
const Trello = require("trello");
const fs = require('fs');
const { Client, EmbedBuilder, GatewayIntentBits } = Discord;
require("dotenv").config();

const trello = new Trello(process.env.TRELLO_API_KEY, process.env.TRELLO_API_TOKEN);

let trelloChannelMap = {};

if (fs.existsSync('./id.json')) {
    trelloChannelMap = JSON.parse(fs.readFileSync('./id.json', 'utf-8'));
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

let lastActionTimestamps = {};

for (const boardId of Object.keys(trelloChannelMap)) {
  lastActionTimestamps[boardId] = new Date();
}

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);

    const commandData = {
        name: 'newtrello',
        description: 'Assigns a Trello board to a Discord channel and thread',
        options: [
            {
                name: 'trello_board_id',
                type: 3,
                description: 'The id of the Trello board',
                required: true,
            },
            {
                name: 'discord_channel_id',
                type: 3,
                description: 'The id of the Discord channel',
                required: true,
            },
            {
                name: 'discord_thread_id',
                type: 3,
                description: 'The id of the Discord thread',
                required: true,
            },
        ],
    };
    
    const guildId = (process.env.GUILD_ID) ;//'49446120'
    const guild = client.guilds.cache.get(guildId);

    if (guild) {
        await guild.commands.create(commandData);
        console.log('Command created in guild.');
    } else {
        console.log('Could not find guild with given ID.');
    }
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;

  if (commandName === 'newtrello') {
      const trelloBoardId = interaction.options.getString('trello_board_id');
      const discordChannelId = interaction.options.getString('discord_channel_id');
      const discordThreadId = interaction.options.getString('discord_thread_id');

      trelloChannelMap[trelloBoardId] = {
          channelId: discordChannelId,
          threadId: discordThreadId
      };

      // Add a new timestamp for the new Trello board
      lastActionTimestamps[trelloBoardId] = new Date();

      fs.writeFileSync('./id.json', JSON.stringify(trelloChannelMap, null, 2));
      
      await interaction.reply(`New Trello board added successfully.`);
  }
});

client.login(process.env.DISCORD_BOT_TOKEN);

async function sendDiscordMessage(channelId, threadId, content) {
  try {
    const channel = client.channels.cache.get(channelId);
    const thread = channel.threads.cache.get(threadId) || await channel.threads.fetch(threadId);
    await thread.send({ embeds: [content] });
    console.log(`Message sent to thread ${threadId}`);
  } catch (err) {
    console.error(`Error sending message to thread ${threadId}: ${err.message}`);
  }
}
async function processAction(action, channelId, threadId) {
  const actionDate = new Date(action.date);

  console.log(`Processing action: ${action.type}`);
  const embed = new EmbedBuilder()
    .setAuthor({ name: action.memberCreator.fullName, iconURL: "https://i.imgur.com/JuhyhHV.png", url: action.memberCreator.url });

  switch (action.type) {
    case "createCard":
      embed.setTitle("Card created")
        .setColor(0x0099FF) // Blue
        .setDescription(`Card Name: ${action.data.card.name}\n Card Description: ${action.data.card.desc}\n (${actionDate})`);
      await sendDiscordMessage(channelId, threadId, embed);
      break;
    case "updateCard":
      if (action.data.listBefore && action.data.listAfter) {
        embed.setTitle("Card moved")
          .setColor(0x00FF99) // Green
          .setDescription(`**Card Name:** ${action.data.card.name}\n**Old List:** ${action.data.listBefore.name}\n**New List:** ${action.data.listAfter.name}\n (${actionDate})`);
        await sendDiscordMessage(channelId, threadId, embed);
      } else if (action.data.old.hasOwnProperty('name')) {
        embed.setTitle("Card title updated")
          .setColor(0xFFFF00) // Yellow
          .setDescription(`Old title: ${action.data.old.name}\nNew title: ${action.data.card.name}\n (${actionDate})`);
        await sendDiscordMessage(channelId, threadId, embed);
      } else if (action.data.old.hasOwnProperty('desc')) {
        embed.setTitle("Card description updated")
          .setColor(0xFFFF00) // Yellow
          .setDescription(`Card Name: ${action.data.card.name}\nNew Description: ${action.data.card.desc}\n(${actionDate})`);
          await sendDiscordMessage(channelId, threadId, embed);
        } else if (action.data.card.closed) {
          embed.setTitle("Card archived")
            .setColor(0xFF0000) // Red
            .setDescription(`Card Name: ${action.data.card.name}\n (${actionDate})`);
          await sendDiscordMessage(channelId, threadId, embed);
        }
        break;
      case "deleteCard":
        embed.setTitle("Card deleted")
          .setColor(0xFF0000) // Red
          .setDescription(`Card Name: ${action.data.card.name}\n (${actionDate})`);
        await sendDiscordMessage(channelId, threadId, embed);
        break;
      case "commentCard":
        embed.setTitle("Card comment added")
          .setColor(0xFF9900) // Orange
          .setDescription(`Card Name: ${action.data.card.name}\nComment: ${action.data.text}\n(${actionDate})`);
        await sendDiscordMessage(channelId, threadId, embed);
        break;
      case "createList":
        embed.setTitle("List created")
          .setColor(0x0099FF) // Blue
          .setDescription(`List Name:${action.data.list.name}\n (${actionDate})`);
        await sendDiscordMessage(channelId, threadId, embed);
        break;
      case "updateList":
        if (action.data.old.hasOwnProperty('name')) {
          embed.setTitle("List name updated")
          .setColor(0xFFFF00) // Yellow
          .setDescription(`Old Name: ${action.data.old.name}\nNew Name: ${action.data.list.name}\n (${actionDate})`);
        } else if (action.data.list.closed) {
          embed.setTitle("List archived")
          .setColor(0xCC0000) // Kirmizi
          .setDescription(`**List Name:** ${action.data.list.name}\n(${actionDate})`);
        }
        await sendDiscordMessage(channelId, threadId, embed);
        break;
      default:
        console.log(`Unhandled action type: ${action.type}`);
    }
  }
  
  const maxRetries = 500;
  const retryDelay = 1000 * 60 * 3; // 3 dakika
  
  async function makeRequestWithRetry(method, path, params, retries = maxRetries) {
    try {
      return await trello.makeRequest(method, path, params);
    } catch (error) {
      console.error(`Error making request: ${error.message}`);
      if (retries === 0) {
          throw error;
      }
      console.error(`Retrying in ${retryDelay / 1000} seconds...`);
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
      return await makeRequestWithRetry(method, path, params, retries - 1);
  }
  
  }
  
  async function updateTrelloActivity() {
    for (const boardId of Object.keys(trelloChannelMap)) {
      const { channelId, threadId } = trelloChannelMap[boardId];
      try {
        const actions = await makeRequestWithRetry("get", `/1/boards/${boardId}/actions`, {
          filter: "createCard,updateCard,deleteCard,commentCard,createList,updateList",
          since: lastActionTimestamps[boardId].toISOString(),
        });
  
        for (const action of actions.reverse()) {
          if (new Date(action.date) > lastActionTimestamps[boardId]) {
            lastActionTimestamps[boardId] = new Date(action.date);
            await processAction(action, channelId, threadId);
          }
        }
      } catch (error) {
        console.error(`Error processing actions for board ${boardId}: ${error.message}`);
      }
    }
  }
  
  
  setInterval(updateTrelloActivity, 15000);
 