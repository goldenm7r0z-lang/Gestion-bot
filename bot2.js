require("dotenv").config();

const {
  Client,
  GatewayIntentBits
} = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

const OWNER_ID = "1256656201488531550";

client.once("ready", () => {
  console.log(`✅ ${client.user.tag} connecté`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  const args = message.content.split(" ");
  const cmd = args.shift().toLowerCase();

  if (cmd === "+dmall") {

    if (message.author.id !== OWNER_ID) {
      return message.reply("❌ Tu ne peux pas utiliser cette commande.");
    }

    const texte = args.join(" ");

    if (!texte) {
      return message.reply(
        "❌ Utilisation : +dmall <message>"
      );
    }

    let sent = 0;

    message.guild.members.cache.forEach(async member => {
      if (member.user.bot) return;

      try {
        await member.send(texte);
        sent++;
      } catch {}
    });

    message.channel.send(
      `✅ Message envoyé à ${sent} membres.`
    );
  }
});

client.login(process.env.TOKEN2);