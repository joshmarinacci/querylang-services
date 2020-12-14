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

import fs from 'fs'
import path from 'path'

function analyze_file(pth, info) {
    console.log("analyizing",pth)

    // submit to http post
    // byte size
    // mime type
    // filename
    // if html page, try to parse and get title and other metadata
    // if mp3 audio, calculate duration and get mp3 tags
    // if image, get format and size
    // https://www.npmjs.com/package/file-type
}

async function scan_dir(dir) {
    let files = await fs.promises.readdir(dir)
    let proms = files.map(async function(f) {
        let pth = path.join(dir,f)
        if(f === '.DS_Store') return
        // console.log("full path",pth)
        let info = await fs.promises.stat(pth)
        // console.log(info.isDirectory())
        if(info.isDirectory()) {
            scan_dir(pth)
        } else {
            // console.log("size", pth, info.size, info.birthtime)
            analyze_file(pth,info)
        }
    })
}
async function run_tests(dir) {
    console.log("scanning the dir", dir)
    scan_dir(dir)
}

if(!process.argv[2]) {
    console.log("no directory specified")
} else {
    run_tests(process.argv[2])
}