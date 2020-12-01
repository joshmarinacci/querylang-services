import {promises as fs} from 'fs'
import path from 'path'

const JSON_DIR = "json"

export async function persist_save(id, body) {
    console.log("saving to id", id, 'with body', body)
    try {
        let blob_path = path.join(JSON_DIR, id)
        let access = await fs.access(JSON_DIR)
        access = await fs.access(blob_path)
        let done = await fs.writeFile(blob_path, JSON.stringify(body))
        console.log("done writing")
        return {
            success:true,
            message:`saved JSON blob at ${id}`
        }
    } catch (e) {
        console.log("cannot access", e)
        return {
            success:false,
            message: `failed`
        }
    }
}

export async function persist_load(id) {
    console.log("loading from id", id)
    try {
        let blob_path = path.join(JSON_DIR, id)
        let access = await fs.access(JSON_DIR)
        access = await fs.access(blob_path)
        let data = await fs.readFile(blob_path)
        console.log("done reading", data.toString())
        let json = JSON.parse(data.toString())
        return {
            success: true,
            message: `loaded JSON blob at ${id}`,
            data: json,
        }
    } catch (e) {
        console.log("cannot access", e)
        return {
            success: false,
            message: `failed`
        }
    }
}