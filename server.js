import {calculate_readability} from './readability-example.js'

import cors from 'cors'
import express from "express"
import {calculate_dir_list} from './files.js'
import {fetch_josh_calendar} from './ical.js'
import {proxy_url} from "./proxy.js"

let app = express()
app.use(cors())
let PORT = 30011
let FILES_DIR = "storage"
app.set("json spaces", "  ")

app.get('/',(req,res)=>{
    res.json({
        status:'success',
        services:['/readability','/files','/calendar/josh']
    })
})
app.get("/readability",(req,res)=>{
    console.log("request for",req.query.url)
    calculate_readability(req.query.url)
        .then(summary => res.json({success:true, summary, url: req.query.url}))
        .catch(e => res.json({success:false}))
})
app.get('/files',(req,res) => calculate_dir_list(FILES_DIR).then(files=>res.json(files)))
app.get('/proxy',(req,res) => proxy_url(req,res))
app.get('/calendar/josh',(req,res)=>{
    console.log("fetching the calendar")
    fetch_josh_calendar().then(cal => res.json(cal))
})
app.listen(PORT,()=>{
    console.log(`listening on port ${PORT}`)
})
