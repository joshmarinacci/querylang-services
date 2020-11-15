import fs from 'fs'
import path from 'path'

function lookup_mimetype(info) {
    if(info.ext === '.jpg') return "image/jpeg"
    return "application/octet-stream"
}

function skip_files(f) {
    if(f === '.DS_Store') return  false
    return true
}

export async function calculateDirectoryList(FILES_DIR) {
    console.log("files dir", FILES_DIR)
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

