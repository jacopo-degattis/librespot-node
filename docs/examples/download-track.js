import fs from 'fs'
import Librespot from 'dev-librespot'
import dotenv from 'dotenv'

dotenv.config();
const spotify = new Librespot()

await spotify.login(process.env.EMAIL, process.env.PASSWORD)

let track = await spotify.get.track('1p80LdxRV74UKvL8gnD7ky')

await fs.promises.writeFile('example.ogg', track.stream)

await spotify.disconnect()
