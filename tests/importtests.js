/*new file system schema

There should be an importer service which is used to import data from elsewhere. Initially it will take a URL and return a new db object. It would scan the URL to learn about it, preferably in some sort of isolated environment. It also fully downloads the file to put into the data store (ie: the real underlying filesystem).  It should scan a url for

    * the content length
* the mime type of the original content
* the filename. From the URL or sometimes internal to the doc (like a PDF?)
* metadata that can be extracted from the file. ex: EXIF data in JPGs.
* look at the starting bytes to verify that this really is the detected mime type. This needs lots of unit tests including for bad data that could try to mess it up.
* if the file is an HTML page, get the title and other metadata, like the author.
* is the file an RSS feed? Is it valid XML?
* If it’s an HTML page, does it contain an RSS feed?
* if it’s a webpage or other textual document, can we generate a summary or abstract? Is one already included in the doc?
* does it have any social share metadata?
* is it a podcast
* is it audio
* if it’s audio or video, what is the duration of the media in addition to the file length
* if it’s an image, what is the bit depth, resolution, size, and other data about it.
*/

/*
[+] Calls scan function with buffer of file
[+] Returns obj
[+] Test that obj is correct name and size and mimetype
- For images get size
- For mp3s get tags
- For PDF get metadata
- Second version does post to service. Same tests.
- Add /ingest Which scans then saves to disk
- On ingest write thumbnail with specific name.
- No state just files on disk with specific name structure.
- Add thumbnail/small route. Returns from disk.
- /files/id/filename thumbs/small.400x600.jpg etc
- Text summary is generated to thumb/short.txt
- Render first page of PDF to png
- Calculate length of PDF in pages
- Returns all info after ingestion
- Also writes all info to info.json during ingestion
- Add test to see if caching worked
- How to prevent simultaneous generation of same file twice?
- Add thumbnail panel to file browser
- Add Thumbnail panel to scan command. Offer to ingest

 */

import fs from 'fs'
import path from 'path'
import FileType from 'file-type'
import {default as mime} from 'mime'
import sizeOf from 'image-size'
import {parseFile} from 'music-metadata'
import {getDocument} from 'pdfjs-dist/es5/build/pdf.js'
import {default as util} from 'util'
import {deepStrictEqual} from 'assert'


// console.log(pdfjs)

async function analyze_file(pth, info) {
    let type = await FileType.fromFile(pth)
    // console.log("analyizing", pth)
    // console.log("type is", type)
    // console.log("info is", info)

    // if html page, try to parse and get title and other metadata
    // if mp3 audio, calculate duration and get mp3 tags
    // if image, get format and size
    let obj = {
        path: pth,
        basename: path.basename(pth),
        size: info.size
        // ext: type.ext,
    }

    if (type) {
        obj.ext = type.ext
        obj.mime = type.mime
    }

    if (!obj.ext) {
        obj.ext = mime.getType(pth)
    }
    //if image, look up the size
    if (obj.mime) {
        let major = obj.mime.substring(0, obj.mime.indexOf('/'))
        let minor = obj.mime.substring(obj.mime.indexOf('/') + 1)
        // console.log(major, '/', minor)
        if (major === 'image') {
            obj.image = {}
            obj.image.dimensions = sizeOf(pth)
            // console.log("image info", obj.image)
        }
        if (major === 'audio' && minor === 'mpeg') {
            let res = await parseFile(pth)
            // console.log("audio", pth, res)
            obj.audio = {
                duration: res.format.duration,
                song: {
                    artist: res.common.artist,
                    album: res.common.album,
                    title: res.common.title,
                }
            }
        }
        if(major === 'application' && minor === 'pdf') {
            // console.log("parsing pdf", getDocument)
            let doc = await getDocument(pth).promise
            let metadata = await doc.getMetadata()
            // console.log('page count', doc.numPages,metadata)
            obj.pdf = {
                pageCount: doc.numPages,
                author: metadata.info.Author,
                title: metadata.info.Title,
            }
        }

    }
    //if pdf, get metadata and page length
    // console.log(obj)
    return [obj]
}

async function scan_dir(dir) {
    let files = await fs.promises.readdir(dir)
    let proms = files.map(async function (f) {
        let pth = path.join(dir, f)
        if (f.startsWith('.')) return
        if (f === '.DS_Store') return
        // console.log("full path",pth)
        let info = await fs.promises.stat(pth)
        // console.log(info.isDirectory())
        if (info.isDirectory()) {
            return scan_dir(pth)
        } else {
            // console.log("size", pth, info.size, info.birthtime)
            return analyze_file(pth, info)
        }
    })
    return Promise.all(proms).then(ret => ret.flat())
}

async function run_tests(dir) {
    console.log("scanning the dir", dir)
    return scan_dir(dir)
}

/*
if (!process.argv[2]) {
    console.log("no directory specified")
} else {
    run_tests(process.argv[2])
        .then(d => {
            // console.log(d)
            console.log(util.inspect(d, {depth:null}))
            // d.forEach(o => util.inspect(o))
        })
}
*/
const log = (...args) => console.log(...args)

async function verify(str) {
    // log("verifying", str)
    let raw = await fs.promises.readFile(str)//.toString()
    let answers = JSON.parse(raw)
    // log(answers)
    for (const ans of answers) {
        // log(ans)
        let pth = path.join(process.cwd(),'../testfiles',ans.path)
        // console.log('analyzing',pth)
        let info = await fs.promises.stat(pth)
        let ret = await analyze_file(pth, info)
        ans.path = ret[0].path
        deepStrictEqual(ans,ret[0])
        log("valid",pth)
        // log(ret[0])
    }
}

// verify('../testfiles/images/answer.json')
verify('../testfiles/mp3s/answer.json')
