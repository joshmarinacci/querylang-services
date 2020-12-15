import fs from 'fs'
import path from 'path'

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
