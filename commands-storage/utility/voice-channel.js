const { SlashCommandBuilder, ChannelType } = require("discord.js")

module.exports = {
    data: new SlashCommandBuilder()
        .setName("vc")
        .setDescription("Changes your voice channel.")
        .addChannelOption(option => option
            .setName("channel")
            .setDescription("Sets your voice channel.")
            .addChannelTypes(ChannelType.GuildVoice)
            .setRequired(true)),
    async execute(interaction) {
        const { member, options } = interaction

        if (member.voice.channelId) {
            interaction.reply("Changing your channel now.", { ephemeral: true })
            const channel = options.getChannel("channel")
            member.voice.setChannel(channel)
        } else {
            interaction.reply("You are not in a voice channel!", { ephemeral: true })
        }
    }
}