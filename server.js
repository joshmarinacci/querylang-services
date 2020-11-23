import {calculate_readability} from './readability-example.js'

import cors from 'cors'
import express from "express"
import {calculate_dir_list, serve_file} from './files.js'
import {fetch_josh_calendar} from './ical.js'
import {proxy_url} from "./proxy.js"
import {parse_feed} from "./rss.js"

let app = express()
app.use(cors())
let PORT = 30011
let FILES_DIR = "storage"
app.set("json spaces", "  ")

app.get('/',(req,res)=>{
    res.json({
        status:'success',
        services:['/readability','/files','/calendar/josh','/proxy','/rss']
    })
})
app.get("/readability",(req,res)=>{
    console.log("request for",req.query.url)
    calculate_readability(req.query.url)
        .then(summary => res.json({success:true, summary, url: req.query.url}))
        .catch(e => res.json({success:false}))
})
app.get('/files/',(req,res) => calculate_dir_list(req,FILES_DIR).then(files=>res.json(files)))
app.get('/files/:filename',(req,res) => serve_file(req,FILES_DIR,res))
app.get('/rss',(req,res)=> parse_feed(req.query.url,res))
app.get('/proxy',(req,res) => proxy_url(req,res))
app.get('/calendar/josh',(req,res)=>fetch_josh_calendar().then(cal => res.json(cal)))
app.listen(PORT,()=>{
    console.log(`listening on port ${PORT}`)
})
