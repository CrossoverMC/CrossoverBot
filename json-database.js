const path = require("path")
const { FSDB } = require("file-system-db")

const databasePath = path.join(__dirname, "database", "database.json")
const db = new FSDB(databasePath, false)

module.exports = {
    BOOTH_CHANNELS_PATH: "boothChannels",
    LINKS_PATH: "links",
    LINKING_PATH: "linking",
    get: (...args) => db.get(...args),
    set: (...args) => db.set(...args),
    has: (...args) => db.has(...args),
    delete: (...args) => db.delete(...args)
}