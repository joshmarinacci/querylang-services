import fs from 'fs'
import fetch from 'node-fetch'
import {deepStrictEqual} from 'assert'

async function verify(json_path) {
    for (const ans of JSON.parse(await fs.promises.readFile(json_path))) {
        let res = await fetch(`http://localhost:30011/scan?url=${ans.url}`)
        delete ans.url
        console.log(ans)

        let json = await res.json()
        delete json.path
        delete json.basename
        delete json.ext
        console.log(json)
        deepStrictEqual(ans,json)

    }


}

verify("./tests/remote.json")
