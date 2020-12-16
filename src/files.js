import fs from 'fs'
import path from 'path'
import {analyze_file, downloadFile} from './scan.js'
import Jimp from "jimp"
import pdf_lib from 'pdfjs-dist/es5/build/pdf.js'
import {render_page_to_png} from './pdf.js'
const {getDocument} = pdf_lib

let DEBUG = false

function lookup_mimetype(info) {
    if(info.ext === '.jpg') return "image/jpeg"
    if(info.ext === '.txt') return "text/plain"
    if(info.ext === '.mp3') return "audio/mpeg"
    return "application/octet-stream"
}

function skip_files(f) {
    if(f === '.DS_Store') return  false
    return true
}

export async function calculate_dir_list(req,FILES_DIR) {
    console.log("listing the files in directory", FILES_DIR)
    console.log("request is",req.path, req.url, req.query, req.params)
    try {

        let acc = await fs.promises.access(FILES_DIR)
        let files = await fs.promises.readdir(FILES_DIR)

        files = files.filter(skip_files)

        let result = []
        for (const file of files) {
            let fpath = path.join(FILES_DIR,file)
            let info = path.parse(fpath)
            result.push({
                name:info.name,
                ext:info.ext,
                mimetype:lookup_mimetype(info)
            })
        }
        return result
    } catch (e) {
        console.log("errored out",e)
        return []
    }
}

export async function serve_file(req,FILES_DIR,res) {
    console.log("sending out the file",req.params.filename)
    let fname = path.resolve(path.join(FILES_DIR,req.params.filename))
    console.log("fname",fname)
    res.sendFile(fname)
}

function log(...args) {
    if(DEBUG) console.log(...args)
}

async function generate_jpeg_thumbnail(data_path, thumbs_dir) {
    log("reading data path",data_path)
    let image = await Jimp.read(data_path)
    log("got image",image)
    image.resize(256, Jimp.AUTO)
    log("resized image")
    let thumb_id = 'thumb.256w.jpg'
    let thumb_path = path.join(thumbs_dir,thumb_id)
    log('writing to',thumb_path)
    await image.writeAsync(thumb_path)
    log("wrote out. done with thumb")
    return {
        path:thumb_path,
        thumbid:thumb_id,
        width: 256,
    }
}

async function generate_pdf_thumbnail(data_path, thumbsdir) {
    log("generating thumbnail at",data_path, 'dir',thumbsdir)
    let doc = await getDocument(data_path).promise
    let metadata = await doc.getMetadata()
    log('metadata is',metadata)
    let thumb_id = "thumb.txt"
    let thumb_path = path.join(thumbsdir,thumb_id)
    await render_page_to_png(data_path,thumb_path)
    return {
        path:thumb_path,
        thumbid:thumb_id,
        length: 500,
    }
}

export async function import_file(url, FILES_DIR) {
    log("importing",url)
    let fileid = "file_"+Math.random().toString(16)
    log("fileid is",fileid)
    let filedir = path.join(FILES_DIR,fileid)
    await fs.promises.mkdir(filedir)
    let thumbsdir = path.join(filedir,'thumbs')
    await fs.promises.mkdir(thumbsdir)
    let data_path = path.join(filedir,'data')
    log("data in",data_path)
    let headers = await downloadFile(url, data_path)
    let stats = await fs.promises.stat(data_path)
    let info = await analyze_file(data_path,stats,headers,url)
    log("info is",info)

    //if image
    if(info.mime === 'image/jpeg') {
        log("generating thumbnail for image",info)
        if(info.image.dimensions.width > 256) {
            let thumb_info = await generate_jpeg_thumbnail(data_path,thumbsdir)
            info.image.thumbs = [thumb_info]
        }
    }

    if(info.mime === 'application/pdf') {
        log("generating thumnail for pdf",info)
        let thumb_info = await generate_pdf_thumbnail(data_path,thumbsdir)
        info.pdf.thumbs = [thumb_info]
    }


    //write the info.json
    let info_path = path.join(filedir,'info.json')
    await fs.promises.writeFile(info_path, JSON.stringify(info))


    return {
        fileid: fileid,
        info: info,
    }
}

export async function get_file_info(fileid,FILES_DIR) {
    // log('getting file info for',fileid)
    let info_path = path.join(FILES_DIR,fileid,'info.json')
    let json = await fs.promises.readFile(info_path)
    json = JSON.parse(json)
    // log("loaded json",json)
    return json
}

export async function list_files(FILES_DIR) {
    // log("listing files in",FILES_DIR)
    let files = await fs.promises.readdir(FILES_DIR)
    files = files.filter(f => {
        if(f.indexOf('.')===0) return false
        if(f.startsWith("file_")) return true
        return false
    })
    let res = []
    for(let id of files) {
        try {
            let info = await get_file_info(id, FILES_DIR)
            // console.log('info is', info)
            res.push({fileid:id,info:info})
        } catch (e) {
            console.log("error",e)
        }
    }
    return res
}

export async function get_thumbs(fileid, thumbid, FILES_DIR, res) {
    log("getting thumb for ",fileid,'called',thumbid)
    let info = await get_file_info(fileid,FILES_DIR)
    log("info is",info.image.thumbs)
    let thumb_info = info.image.thumbs.find(th => th.thumbid === thumbid)
    log("thumb info is",thumb_info)
    let abs = path.join(process.cwd(),thumb_info.path)
    log('abs path is',abs)
    res.sendFile(abs)
}

export async function get_file_data(fileid, FILES_DIR, res) {
    log("getting file data for",fileid)
    let file_path = path.join(process.cwd(),FILES_DIR,fileid,'data')
    log("abs data path is",file_path)
    res.sendFile(file_path)
}
