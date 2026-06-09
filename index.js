// #region Configuration du BOT
const { Client, GatewayIntentBits, Partials, PermissionFlagsBits } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions
    ],
    partials: [
        Partials.GuildMember,
        Partials.User,
        Partials.Message,
        Partials.Reaction
    ]
});

const ID_SALON_BIENVENUE = "1408157176316559420";

// CORRECTION ICI : L'événement s'appelle 'ready' et non 'clientReady'
client.once('ready', () => {
    console.log(`\n🤖 Bot connecté avec succès en tant que ${client.user.tag}!`);
});
// #endregion

// #region Bonjour/aurevoir
client.on('guildMemberAdd', async (member) => {
    try {
        const salon = member.guild.channels.cache.get(ID_SALON_BIENVENUE);
        if (!salon) return;

        await salon.send(`Bienvenue dans le clan ${member} ! 🎉 Prend une chope 🍺 et profite.`);
    } catch (error) {
        console.error("Erreur lors de l'envoi du message de bienvenue :", error);
    }
});

client.on('guildMemberRemove', async (member) => {
    try {
        const salon = member.guild.channels.cache.get(ID_SALON_BIENVENUE);
        if (!salon) return;

        await salon.send(`Oh, ${member.user.displayName} a quitté le clan. 😢 Il n'était pas assez digne ⚔️`);
    } catch (error) {
        console.error("Erreur lors de l'envoi du message de départ :", error);
    }
});
// #endregion

// #region Command et Réact
client.on('messageCreate', async (message) => {
    let admin = message.member.permissions.has(PermissionFlagsBits.ManageMessages)
    if (message.author.bot) return;

    // #region PARTIE AUTOMATIQUE (Exécution passive sur les messages)
    const emojiPanneau = "<:emoji_13:1513814609604120677>";

    if (message.content.includes(emojiPanneau)) {
        try {
            await message.react(emojiPanneau);
        } catch (error) {
            console.error("Impossible de réagir avec l'émoji :", error);
        }
    }
    // #endregion

    // #region PARTIE CLIENT (Accessibles à n'importe quel utilisateur)
    if (message.content === '!hello') {
        return message.channel.send(`Salut ${message.author.username} alias ${message.author.displayName} !👋`);
    }

    if (message.content === '!roll') {
        const resultatDe = Math.floor(Math.random() * 6) + 1;
        return message.reply(`🎲 Tu as lancé un dé et tu as obtenu un **${resultatDe}** !`);
    }
    // #endregion

    // #region PARTIE ADMIN (Réservée aux modérateurs et administrateurs)

    // Commandes de Modération (!message et !react)
    if (message.content.startsWith('!message') && admin) {
        const args = message.content.slice('!message'.length).trim().split(/ +/);
        const salonCible = message.mentions.channels.first();
        args.shift();
        const texteAEnvoyer = args.join(' ');

        if (!salonCible || !texteAEnvoyer) {
            return message.reply("❌ Syntaxe incorrecte. Exemple : `!message #salon Votre texte`.");
        }

        try {
            await message.reply(`${message.member.displayName} : ${texteAEnvoyer} sur ${salonCible}`);
            await salonCible.send(texteAEnvoyer);
            await message.delete();
        } catch (error) {
            console.error("Erreur lors de l'envoi du message forcé :", error);
        }
    }

    else if (message.content.startsWith('!react') && admin) {
        const args = message.content.slice('!react'.length).trim().split(/ +/);
        const salonCible = message.mentions.channels.first();
        args.shift();

        const idMessage = args[0];
        const emojiBrut = args[1];
        const roleCible = message.mentions.roles.first();

        if (!salonCible || !idMessage || !emojiBrut || !roleCible) {
            return message.reply("❌ Syntaxe incorrecte. Exemple : `!react #salon ID_MESSAGE :emoji: @Role`");
        }

        try {
            const messageCible = await salonCible.messages.fetch(idMessage);
            await messageCible.react(emojiBrut);

            const filtre = (reaction, user) => reaction.emoji.name === emojiBrut || reaction.emoji.toString() === emojiBrut;
            const collector = messageCible.createReactionCollector({ filtre, dispose: true });

            collector.on('collect', async (reaction, user) => {
                if (user.bot) return;
                try {
                    const membre = await message.guild.members.fetch(user.id);
                    await membre.roles.add(roleCible);
                    console.log(`Rôle ${roleCible.name} ajouté à ${membre.displayName}`);
                } catch (err) {
                    console.error("Erreur lors de l'ajout du rôle :", err);
                }
            });

            collector.on('remove', async (reaction, user) => {
                if (user.bot) return;
                try {
                    const membre = await message.guild.members.fetch(user.id);
                    await membre.roles.remove(roleCible);
                    console.log(`Rôle ${roleCible.name} retiré à ${membre.displayName}`);
                } catch (err) {
                    console.error("Erreur lors du retrait du rôle :", err);
                }
            });

            await message.reply(`✅ Système de Reaction Role configuré avec succès sur le message dans ${salonCible} !`);
            await message.delete();

        } catch (error) {
            console.error("Erreur lors de la configuration du !react :", error);
            message.reply("❌ Impossible de configurer le système. Vérifie l'ID du message et s'il est bien dans le salon spécifié.");
        }
    }

    // Commandes d'Administration Pure (!muteAll, !unmuteAll, !clear)
    else if (message.content === '!muteAll') {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply("❌ Seuls les administrateurs peuvent utiliser cette commande.");
        }

        try {
            const roleEveryone = message.guild.roles.everyone;
            await message.channel.permissionOverwrites.edit(roleEveryone, { SendMessages: false });
            await message.channel.send("🔒 **Le salon a été verrouillé.** Tout le monde a été rendu muet ici, sauf les administrateurs !");
            await message.delete().catch(() => { });
        } catch (error) {
            console.error("Erreur lors du !muteAll :", error);
            message.reply("❌ Je n'ai pas pu verrouiller le salon.");
        }
    }
    else if (message.content === '!unmuteAll') {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply("❌ Seuls les administrateurs peuvent utiliser cette commande.");
        }

        try {
            const roleEveryone = message.guild.roles.everyone;
            await message.channel.permissionOverwrites.edit(roleEveryone, { SendMessages: null });
            await message.channel.send("🔓 **Le salon a été déverrouillé.** Tout le monde peut de nouveau écrire !");
            await message.delete().catch(() => { });
        } catch (error) {
            console.error("Erreur lors du !unmuteAll :", error);
            message.reply("❌ Je n'ai pas pu déverrouiller le salon.");
        }
    }
    else if (message.content.startsWith('!clear')) {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply("❌ Seuls les administrateurs peuvent utiliser cette commande.");
        }

        const args = message.content.slice('!clear'.length).trim().split(/ +/);
        const nombreDeMessages = parseInt(args[0]);

        if (isNaN(nombreDeMessages) || nombreDeMessages < 1 || nombreDeMessages > 99) {
            return message.reply("❌ Tu dois spécifier un nombre entre 1 and 99. Exemple : `!clear 10`.");
        }

        const messageDemande = await message.reply(`⚠️ Tu es sur le point de supprimer les **${nombreDeMessages}** derniers messages. Tape \`!ok\` pour confirmer ou \`!cancel\` pour annuler.`);

        const filtre = response => response.author.id === message.author.id && ['!ok', '!cancel'].includes(response.content.toLowerCase());
        const collector = message.channel.createMessageCollector({ filter: filtre, time: 15000, max: 1 });

        collector.on('collect', async (reponseMessage) => {
            if (reponseMessage.content.toLowerCase() === '!ok') {
                try {
                    const messagesDuSalon = await message.channel.messages.fetch({ limit: nombreDeMessages + 2 });
                    const limite14Jours = Date.now() - (14 * 24 * 60 * 60 * 1000);
                    const messagesSupprimables = messagesDuSalon.filter(msg => msg.createdTimestamp > limite14Jours);
                    const quantiteReelle = messagesSupprimables.size - 2;

                    if (messagesSupprimables.size > 0) {
                        await message.channel.bulkDelete(messagesSupprimables);
                    }

                    let texteConfirmation = `🗑️ **${quantiteReelle}** message(s) récent(s) ont été supprimés.`;
                    if (quantiteReelle < nombreDeMessages) {
                        texteConfirmation += ` *(Les autres messages demandés étaient trop vieux (+ de 14j) et ont été ignorés pour éviter un crash).*`;
                    }

                    const confirmation = await message.channel.send(texteConfirmation);
                    setTimeout(() => confirmation.delete().catch(() => { }), 5000);

                } catch (error) {
                    console.error("Erreur lors du filtrage et de la suppression :", error);
                    message.channel.send("❌ Une erreur est survenue lors de la tentative de suppression.");
                }
            } else {
                await messageDemande.edit("❌ Suppression annulée.");
                await reponseMessage.delete().catch(() => { });
                setTimeout(() => messageDemande.delete().catch(() => { }), 3000);
            }
        });

        collector.on('end', async (collected, reason) => {
            if (reason === 'time') {
                await messageDemande.edit("⏱️ Temps écoulé, la suppression a été annulée.").catch(() => { });
                setTimeout(() => messageDemande.delete().catch(() => { }), 3000);
            }
        });
    }
    // #endregion
});
// #endregion

// #region Erreur et Start
process.on('unhandledRejection', error => {
    console.error('\n[ERREUR] Une erreur est survenue lors de la connexion :');
    console.error(error.message);
});

client.login(process.env.DISCORD_TOKEN);
// #endregion