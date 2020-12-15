import fetch from 'node-fetch'

import metascraper0 from 'metascraper'
import ms_author from 'metascraper-author'
import ms_desc from 'metascraper-description'
import ms_date from 'metascraper-date'
import ms_image from "metascraper-image"
import ms_logo from "metascraper-logo"
import ms_title from "metascraper-title"
import ms_lang from "metascraper-lang"
import ms_url from "metascraper-url"
import ms_favicon from "metascraper-logo-favicon"

import fs from 'fs'
import FileType from 'file-type'
import path from 'path'
import {default as mime} from 'mime'
import sizeOf from 'image-size'
import {parseFile} from 'music-metadata'
import {getDocument} from 'pdfjs-dist/es5/build/pdf.js'

function josh_rss_detector() {
    const rules = {
        feed: [
            // They receive as parameter:
            // - `htmlDom`: the cheerio HTML instance.
            // - `url`: The input URL used for extact the content.
            ({ htmlDom: $, url }) => $('link[type="application/rss+xml"]').attr('href'),
            // ({ htmlDom: $, url }) => $('meta[itemprop="logo"]').attr('content')
        ]
    }
    return rules
}

const metascraper = metascraper0([
    ms_author(),
    ms_date(),
    ms_desc(),
    ms_image(),
    ms_logo(),
    ms_lang(),
    ms_title(),
    ms_url(),
    ms_favicon(),
    josh_rss_detector(),
])

export function scan_url_old(url, res) {
    console.log("scanning",url)
    let info = {}
    fetch(url).then(req => {
        console.log("okay is", req.ok)
        // console.log("request headers is",req.headers)
        console.log("content type is", req.headers.get('content-type'))
        console.log("real url is",req.url,req.useFinalURL)
        info.mimetype = req.headers.get("content-type")
        return req.text()
    }).then(html => {
        // console.log("html is",html)
        return metascraper({html,url})
    }).then(meta => {
        console.log("scanned is",meta)
        res.json(Object.assign(meta,info))
    })

}


const downloadFile = (async (url, path) => {
    const res = await fetch(url);
    // console.log("download file. okay is",res.ok)
    // console.log("content type is", res.headers.get('content-type'))
    const fileStream = fs.createWriteStream(path);
    return await new Promise((resolve, reject) => {
        res.body.pipe(fileStream);
        res.body.on("error", reject);
        fileStream.on("finish", ()=>resolve(res.headers));
    });
});


export async function scan_url(url, res) {
    console.log("/scan", url)
    let pth = 'tempfile'+Math.random().toString(16)
    let headers = await downloadFile(url, pth)
    let info = await fs.promises.stat(pth)
    let ret = await analyze_file(pth,info,headers,url)
    console.log("returning",ret)
    res.json(ret)
}

async function analyze_file(pth, info, headers,url) {
    let type = await FileType.fromFile(pth)
    // console.log("analyizing", pth)
    // console.log("type is", type)
    // console.log("info is", info)
    // console.log("headers is",headers)
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
        console.log(major, '/', minor)
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
                info: {
                    artist: res.common.artist,
                    album: res.common.album,
                    title: res.common.title,
                }
            }
        }
        if (major === 'video' && minor === 'mp4') {
            let res = await parseFile(pth)
            // console.log("video", pth, res)
            obj.video = {
                duration: res.format.duration,
                info: {
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

    if(!obj.mime) {
        obj.mime = headers.get('content-type')
        if(obj.mime.indexOf(";")>0) {
            obj.mime = obj.mime.substring(0,obj.mime.indexOf(";"))
        }
    }

    if(obj.mime === 'text/html') {
        let html = await fs.promises.readFile(pth)
        html = html.toString()
        console.log("html is",html)
        let data = await metascraper({html,url})
        console.log("found data",data)
        obj.html = data
    }
    //if pdf, get metadata and page length
    // console.log(obj)
    return obj
}


