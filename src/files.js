import fs from 'fs'
import path from 'path'
import {analyze_file, downloadFile} from './scan.js'

let DEBUG = true

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

export async function import_file(url, FILES_DIR) {
    log("importing",url)
    let fileid = "file_"+Math.random().toString(16)
    log("fileid is",fileid)
    let filedir = path.join(FILES_DIR,fileid)
    await fs.promises.mkdir(filedir)
    let data_path = path.join(filedir,'data')
    log("data in",data_path)
    let headers = await downloadFile(url, data_path)
    let stats = await fs.promises.stat(data_path)
    let info = await analyze_file(data_path,stats,headers,url)
    log("info is",info)
    let info_path = path.join(filedir,'info.json')
    await fs.promises.writeFile(info_path, JSON.stringify(info))
    return {
        fileid: fileid,
        info: info,
    }
}

export async function get_file_info(fileid,FILES_DIR) {
    log('getting file info for',fileid)
    let info_path = path.join(FILES_DIR,fileid,'info.json')
    let json = await fs.promises.readFile(info_path)
    json = JSON.parse(json)
    log("loaded json",json)
    return json
}

export async function list_files(FILES_DIR) {
    log("listing files in",FILES_DIR)
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
            console.log('info is', info)
            res.push({fileid:id,info:info})
        } catch (e) {
            console.log("error",e)
        }
    }
    // files = await Promise.all(files.map(f => get_file_info(f,FILES_DIR))).then(d => console.log('got d',d))
    // files = await Promise.all(files.map(f => {
    //     return {
    //         fileid:f,
    //         info: get_file_info(f,FILES_DIR)
    //     }
    // }))
    log("files info",res)
    return res
}