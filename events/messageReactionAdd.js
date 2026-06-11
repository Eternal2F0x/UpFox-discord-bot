// events/messageReactionAdd.js
module.exports = {
    name: 'messageReactionAdd',
    async execute(reaction, user) {
        if (user.bot) return;

        // Vérifier si ce message est dans notre mémoire
        const reactConfig = reaction.client.state.reactRoles?.get(reaction.message.id);
        if (!reactConfig) return;

        // Vérifier si c'est le bon émoji
        if (reaction.emoji.name === reactConfig.emoji) {
            const member = await reaction.message.guild.members.fetch(user.id);
            const role = reaction.message.guild.roles.cache.get(reactConfig.roleId);
            
            if (role) await member.roles.add(role);
        }
    }
};