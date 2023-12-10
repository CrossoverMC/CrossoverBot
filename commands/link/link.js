const { SlashCommandBuilder } = require("discord.js")
const jsonDatabase = require("../../json-database")

function generateCode() {
    let code = ""

    for (let i = 0; i < 6; i++) {
        code += Math.floor((Math.random() * 10))
    }

    return code
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("link")
        .setDescription("Get a code to link your Minecraft account to your Discord account."),
    async execute(interaction) {
        const userId = interaction.user.id

        if (jsonDatabase.has(jsonDatabase.LINKS_PATH  + "." + userId)) {
            await interaction.reply({ content: "Your Discord account is already linked to a Minecraft account!", ephemeral: true })
        } else {
            const code = generateCode()
            jsonDatabase.set(jsonDatabase.LINKING_PATH + "." + userId, code)
            await interaction.reply({ content: "Your code is: " + code, ephemeral: true })
        }
    }
}