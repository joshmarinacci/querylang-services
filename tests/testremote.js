import fs from 'fs'
import fetch from 'node-fetch'
import {deepStrictEqual} from 'assert'

async function verify(json_path, id) {
    console.log(id)
    for (const ans of JSON.parse(await fs.promises.readFile(json_path))) {
        if(id && ans.id !== id) continue
        console.log("scanning",ans.url)
        let res = await fetch(`http://localhost:30011/scan?url=${ans.url}`)
        delete ans.url
        // console.log(ans)

        let json = await res.json()
        delete json.path
        delete json.basename
        delete json.ext
        // console.log(json)
        if(ans.mime === 'text/html') {
            delete ans.id
            delete ans.size
            delete json.size
            delete json.html.date
            delete json.html.image
            delete json.html.logo

        }
        deepStrictEqual(ans,json)

    }


}

verify("./tests/remote.json",process.argv[2])
