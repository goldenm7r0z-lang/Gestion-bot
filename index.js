require("dotenv").config();
const fs = require("fs");
const ticketCategoryName = "🎫 tickets";

const {
  Client,
  GatewayIntentBits,
  PermissionsBitField,
  EmbedBuilder
} = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

const prefix = "+";

/* ================= SNIPE ================= */
let lastDeleted = null;

/* ================= AUTOROLES ================= */
let autoRoles = {};

if (fs.existsSync("autoroles.json")) {
  try {
    autoRoles = JSON.parse(
      fs.readFileSync("autoroles.json", "utf8")
    );
  } catch {
    autoRoles = {};
  }
}

/* ================= READY ================= */
client.once("ready", () => {
  console.log(`✅ Connecté : ${client.user.tag}`);

  client.user.setPresence({
    status: "dnd"
  });
});

/* ================= AUTO ROLE ================= */
client.on("guildMemberAdd", async (member) => {
  const roleId = autoRoles[member.guild.id];

  if (!roleId) return;

  const role = member.guild.roles.cache.get(roleId);

  if (!role) return;

  try {
    await member.roles.add(role);
  } catch (err) {
    console.error(err);
  }
});

/* ================= MESSAGE DELETE ================= */
client.on("messageDelete", (message) => {
  if (!message.guild) return;
  if (!message.author || message.author.bot) return;

  lastDeleted = {
    content: message.content,
    author: message.author.tag,
    channel: message.channel.name,
    time: new Date()
  };
});

/* ================= HELP ================= */
function helpEmbed() {
  return new EmbedBuilder()
    .setColor("#5865F2")
    .setTitle("🤖 MENU DES COMMANDES")
    .addFields(
      {
        name: "🧾 Utilitaires",
        value: "`+say <message>`"
      },
      {
  name: "🛡️ Modération",
  value:
    "`+kick <@user>`\n`+ban <@user>`\n`+clear <nombre>`\n`+addrole <id> <@rôle>`\n`+removerole <id> <@rôle>`"
},
      {
        name: "🕵️ Autre",
        value: "`+snipe`"
      }
    )
    .setTimestamp();
}

/* ================= GET MEMBER ================= */
function getMember(message, args) {
  return (
    message.mentions.members.first() ||
    message.guild.members.cache.get(args[0])
  );
}

/* ================= COMMANDES ================= */
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.guild) return;
  if (!message.content.startsWith(prefix)) return;

  const args = message.content
    .slice(prefix.length)
    .trim()
    .split(/ +/);

  const cmd = args.shift()?.toLowerCase();

  /* HELP */
  if (cmd === "help") {
    return message.channel.send({
      embeds: [helpEmbed()]
    });
  }

  /* SAY */
  if (cmd === "say") {
  if (!args.length) {
    return message.reply("❌ Message manquant.");
  }

  const text = args.join(" ");

  try {
    // supprime le message de l'utilisateur
    await message.delete().catch(() => {});

    // envoie le message du bot
    return message.channel.send(text);

  } catch (err) {
    console.error(err);
    return message.channel.send("❌ Erreur commande say.");
  }
}

  /* KICK */
  if (cmd === "kick") {
    if (
      !message.member.permissions.has(
        PermissionsBitField.Flags.KickMembers
      )
    ) {
      return message.channel.send("❌ Pas la permission.");
    }

    const member = getMember(message, args);

    if (!member) {
      return message.channel.send("❌ Membre introuvable.");
    }

    try {
      await member.kick();

      return message.channel.send(
        `👢 ${member.user.tag} a été kick.`
      );
    } catch {
      return message.channel.send(
        "❌ Impossible de kick."
      );
    }
  }

  /* BAN */
  if (cmd === "ban") {
    if (
      !message.member.permissions.has(
        PermissionsBitField.Flags.BanMembers
      )
    ) {
      return message.channel.send("❌ Pas la permission.");
    }

    const member = getMember(message, args);

    if (!member) {
      return message.channel.send("❌ Membre introuvable.");
    }

    try {
      await member.ban();

      return message.channel.send(
        `🔨 ${member.user.tag} a été banni.`
      );
    } catch {
      return message.channel.send(
        "❌ Impossible de bannir."
      );
    }
  }

  /* CLEAR */
  if (cmd === "clear") {
  if (
    !message.member.permissions.has(
      PermissionsBitField.Flags.ManageMessages
    )
  ) {
    return message.channel.send("❌ Pas la permission.");
  }

  let targetUser = message.mentions.users.first();
  let amount;

  // Si premier argument est un user mentionné
  if (targetUser) {
    amount = parseInt(args[1]);
  } else {
    amount = parseInt(args[0]);
  }

  if (!amount || amount < 1) {
    return message.channel.send("❌ Nombre invalide.");
  }

  if (amount > 1000) {
    return message.channel.send("❌ Maximum 1000 messages.");
  }

  try {
    await message.delete().catch(() => {});

    const fetched = await message.channel.messages.fetch({
      limit: 100
    });

    let filtered = fetched.filter(m => !m.pinned);

    // Si user mentionné → filtrer par user
    if (targetUser) {
      filtered = filtered.filter(m => m.author.id === targetUser.id);
    }

    filtered = filtered.first(amount);

    await message.channel.bulkDelete(filtered, true);

    const msg = await message.channel.send(
      `🧹 ${filtered.length} messages supprimés`
    );

    setTimeout(() => {
      msg.delete().catch(() => {});
    }, 3000);

  } catch (err) {
    console.error(err);
    return message.channel.send("❌ Erreur clear.");
  }
}

  /* SNIPE */
  if (cmd === "snipe") {
    if (!lastDeleted) {
      return message.channel.send(
        "❌ Aucun message supprimé."
      );
    }

    const embed = new EmbedBuilder()
      .setColor("#ff4da6")
      .setAuthor({
        name: `${lastDeleted.author} • Message supprimé`,
        iconURL: message.author.displayAvatarURL()
      })
      .setDescription(
        lastDeleted.content || "*message vide*"
      )
      .setFooter({
        text: `Salon: ${lastDeleted.channel} • ${new Date(
          lastDeleted.time
        ).toLocaleString()}`
      })
      .setTimestamp();

    return message.channel.send({
      embeds: [embed]
    });
  }

  /* AUTOROLE */
  if (cmd === "autorole") {
    if (
      !message.member.permissions.has(
        PermissionsBitField.Flags.Administrator
      )
    ) {
      return message.channel.send("❌ Pas la permission.");
    }

    const role = message.mentions.roles.first();

    if (!role) {
      return message.channel.send(
        "❌ Mentionne un rôle."
      );
    }

    autoRoles[message.guild.id] = role.id;

    fs.writeFileSync(
      "autoroles.json",
      JSON.stringify(autoRoles, null, 2)
    );

    return message.channel.send(
      `✅ Autorole configuré sur ${role}.`
    );
  }

  /* ADDROLE */
  if (cmd === "addrole") {
  if (
    !message.member.permissions.has(
      PermissionsBitField.Flags.ManageRoles
    )
  ) {
    return message.channel.send("❌ Pas la permission.");
  }

  const member = message.mentions.members.first();
  const role = message.mentions.roles.first();

  if (!member) {
    return message.channel.send("❌ Mentionne un utilisateur.");
  }

  if (!role) {
    return message.channel.send("❌ Mentionne un rôle.");
  }

  if (!member.manageable) {
    return message.channel.send("❌ Je ne peux pas modifier ce membre.");
  }

  try {
    await member.roles.add(role);

    return message.channel.send(
      `✅ ${role} ajouté à ${member.user.tag}.`
    );
  } catch (err) {
    console.error(err);
    return message.channel.send("❌ Erreur ajout rôle.");
  }
}

if (cmd === "removerole") {
  if (
    !message.member.permissions.has(
      PermissionsBitField.Flags.ManageRoles
    )
  ) {
    return message.channel.send("❌ Pas la permission.");
  }

  const member = message.mentions.members.first();
  const role = message.mentions.roles.first();

  if (!member) {
    return message.channel.send("❌ Mentionne un utilisateur.");
  }

  if (!role) {
    return message.channel.send("❌ Mentionne un rôle.");
  }

  if (!member.roles.cache.has(role.id)) {
    return message.channel.send("❌ Ce membre n'a pas ce rôle.");
  }

  if (!member.manageable) {
    return message.channel.send("❌ Je ne peux pas modifier ce membre.");
  }

  try {
    await member.roles.remove(role);

    return message.channel.send(
      `✅ ${role} retiré à ${member.user.tag}.`
    );
  } catch (err) {
    console.error(err);
    return message.channel.send("❌ Erreur retrait rôle.");
  }
}

/* DERANK */
/* DERANK */
if (cmd === "derank") {
  if (
    !message.member.permissions.has(
      PermissionsBitField.Flags.ManageRoles
    )
  ) {
    return message.channel.send("❌ Pas la permission.");
  }

  let member =
    message.mentions.members.first() ||
    message.guild.members.cache.get(args[0]);

  if (!member && args[0]) {
    try {
      member = await message.guild.members.fetch(args[0]);
    } catch {}
  }

  if (!member) {
    return message.channel.send(
      "❌ Utilisateur introuvable. Utilise une mention ou un ID Discord."
    );
  }

  if (!member.manageable) {
    return message.channel.send(
      "❌ Je ne peux pas modifier ce membre."
    );
  }

  const highestRole = member.roles.cache
    .filter(role => role.id !== message.guild.id)
    .sort((a, b) => b.position - a.position)
    .first();

  if (!highestRole) {
    return message.channel.send(
      "❌ Ce membre n'a aucun rôle à retirer."
    );
  }

  try {
    await member.roles.remove(highestRole);

    const embed = new EmbedBuilder()
      .setColor("#ff0000")
      .setTitle("⬇️ Derank effectué")
      .setDescription(
        `👤 **Membre :** ${member}\n🗑️ **Rôle retiré :** ${highestRole}\n\n✅ ${member} a été derank avec succès.`
      )
      .setThumbnail(member.user.displayAvatarURL())
      .setFooter({
        text: `Action effectuée par ${message.author.tag}`
      })
      .setTimestamp();

    return message.channel.send({
      embeds: [embed]
    });

  } catch (err) {
    console.error(err);
    return message.channel.send(
      "❌ Impossible de retirer le rôle."
    );
  }
}
});

/* ================= LOGIN ================= */
client.login(process.env.TOKEN);