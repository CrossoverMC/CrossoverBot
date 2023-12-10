const { SlashCommandBuilder } = require("discord.js")
const jsonDatabase = require("../../json-database")

module.exports = {
    data: new SlashCommandBuilder()
        .setName("unlink")
        .setDescription("Unlinks your Discord account from your Minecraft account."),
    async execute(interaction) {
        const { client, member, user } = interaction
        const userId = user.id
        const path = jsonDatabase.LINKS_PATH + "." + userId

        if (jsonDatabase.has(path)) {
            jsonDatabase.delete(path)
            client.emit("minecraftAccountUnlinked", member)
            await interaction.reply({ content: "Your accounts have been unlinked.", ephemeral: true })
        } else {
            await interaction.reply({ content: "Your Discord account has not been linked to a Minecraft account.", ephemeral: true })
        }
    }
}