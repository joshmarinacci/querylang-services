// - Ingest remote file. Returns id and info
// - List files. See if there
//     - Get file info. Verify
// - Get file data. Verify.
// - Get file thumb. Verify size or text.


import fs from 'fs'
import fetch from 'node-fetch'
import {deepStrictEqual, strictEqual} from 'assert'

const BASE = "http://localhost:30011"

async function run_test(tst) {
    console.log("testing", tst)

    //call /scan?url to get info
    let scan_info = await fetch(`${BASE}/scan?url=${tst.url}`).then(r => r.json())
    console.log("scan info is", scan_info)
    //call /files/import?url   get id and info. verify the same
    let import_result = await fetch(`${BASE}/files/import?url=${tst.url}`).then(r=>r.json())
    console.log("import result is",import_result)

    strictEqual(scan_info.size,import_result.info.size)
    strictEqual(scan_info.mime,import_result.info.mime)

    //call /files/file/id/info to get the info. verify the same
    let info_result = await fetch(`${BASE}/files/${import_result.fileid}/info`).then(r => r.json())
    strictEqual(scan_info.size,info_result.size)

    //call /files/list  to get all files
    let list_result = await fetch(`${BASE}/files/list`).then(r => r.json())
    strictEqual(list_result.some(file => file.id === import_result.fileid),true)
    strictEqual(list_result.some(file => file.size === scan_info.size),true)

    //call /files/file/id/thumbs/thumb.256.jpg verify the size
    let thumb = await fetch(`${BASE}/files/${import_result.fileid}/thumbs/thumb.256.jpg`).then(r => r.data())
    console.log("got data",thumb)
    strictEqual(get_image_size_from_buffer(thumb).width,256)

    //call /files/file/id/data to get the real data. verify the length
    let data = await fetch(`${BASE}/files/${import_result.fileid}/data`).then(r => r.data())
    strictEqual(data.length,30000)
}

async function run(json_path, id) {
    let tests = JSON.parse(await fs.promises.readFile(json_path));
    tests.forEach(tst => {
        console.log("running", tst)
        run_test(tst)
    })
}

// run("./tests/remote.json",process.argv[2])

run_test({
    url: 'https://vr.josh.earth/assets/2dimages/saturnv.jpg',
})