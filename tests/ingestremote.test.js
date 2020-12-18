// - Ingest remote file. Returns id and info
// - List files. See if there
//     - Get file info. Verify
// - Get file data. Verify.
// - Get file thumb. Verify size or text.


import fs from 'fs'
import fetch from 'node-fetch'
import {deepStrictEqual, strictEqual, ok} from 'assert'
import sizeOf from 'image-size'
import {inspect} from 'util'
import assert from 'assert'

const BASE = "http://localhost:30011"

async function dfetch(...args) {
    // console.log('fetch',...args)
    return fetch(...args)
}

async function doWait(number) {
    console.log('waiting',number)
    return new Promise((res,rej)=> setTimeout(res,number))
}

async function run_test(tst) {
    console.log("testing", tst)

    //call /scan?url to get info
    let scan_info = await dfetch(`${BASE}/scan?url=${tst.url}`).then(r => r.json())
    // console.log("scan info is", scan_info)
    //call /files/import?url   get id and info. verify the same
    // console.log('importing at',BASE)
    let import_result = await dfetch(`${BASE}/files/import?url=${tst.url}`).then(r=>r.json())
    // console.log("import result is",inspect(import_result, {depth: 10}))

    strictEqual(scan_info.size,import_result.info.size)
    strictEqual(scan_info.mime,import_result.info.mime)

    //call /files/file/id/info to get the info. verify the same
    await doWait(1000)
    // console.log("gettting the info")
    let info_result = await dfetch(`${BASE}/files/file/${import_result.fileid}/info`).then(r => r.json())
    // console.log("info is",info_result)
    strictEqual(scan_info.size,info_result.size)

    //call /files/list  to get all files
    let list_result = await fetch(`${BASE}/files/list`).then(r => r.json())
    // console.log("list result is",list_result)
    // console.log("looking for",import_result.fileid)
    ok(list_result.some(file => file.fileid === import_result.fileid),true)
    ok(list_result.some(file => file.info.size === scan_info.size),true)


    // //call /files/file/id/thumbs/thumb.256.jpg verify the size
    if(tst.thumb) {
        if(tst.thumb.image) {
            // console.log("checking image thumb")
            let thumb = await fetch(`${BASE}/files/file/${import_result.fileid}/thumbs/thumb.256w.jpg`).then(r => r.buffer())
            // console.log("got thumb",thumb)
            // strictEqual(thumb.type,'image/jpeg')
            // let dim = sizeOf(thumb)
            // console.log("dims is",dim)
            deepStrictEqual(sizeOf(thumb),tst.thumb.image)
        }
        if(tst.thumb.text) {
            // console.log("checking text thumb")
            assert(import_result.info.text.thumbs)
            let thumb = await fetch(`${BASE}/files/file/${import_result.fileid}/thumbs/thumb.txt`).then(r => r.text())
            // console.log("got thumb ",thumb,tst.thumb.text.start)
            assert(thumb.startsWith(tst.thumb.text.start))
        }
    }

    //call /files/file/id/data to get the real data. verify the length
    let data = await dfetch(`${BASE}/files/file/${import_result.fileid}/data`).then(r => r.buffer())
    // console.log("got data",data)
    strictEqual(data.length,tst.size)
    console.log("SUCCESS:",tst.url)
}

async function run(json_path, id) {
    let tests = JSON.parse(await fs.promises.readFile(json_path));
    tests.forEach(tst => {
        console.log("running", tst)
        run_test(tst)
    })
}

let tests = [
    {
        url: 'https://vr.josh.earth/assets/2dimages/saturnv.jpg',
        size: 349792,
        thumb: {
            image: {
                width: 256,
                height: 204,
                orientation:1,
                type:'jpg',
            }
        }
    },
    {
        url:"http://127.0.0.1:8080/pdfs/20reasons.pdf",
        size:158397,
    },
    {
        url:"http://127.0.0.1:8080/text/bretvictor.md",
        size:36842,
        thumb: {
            text: {
                start:'[TOC]'
            }
        }
    },
    {
        url:"http://127.0.0.1:8080/text/rpneval.js",
        size:784,
        thumb: {
            text: {
                start:'const e'
            }
        }
    }
]

async function go() {
    for (let test of tests) {
        await run_test(test)
    }
}

go().then("test is done");
