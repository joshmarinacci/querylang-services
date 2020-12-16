import {calculate_readability} from './readability-example.js'

import cors from 'cors'
import express from "express"
import {calculate_dir_list, get_file_info, import_file, list_files, serve_file} from './src/files.js'
import {fetch_josh_calendar} from './ical.js'
import {proxy_url} from "./proxy.js"
import {parse_feed} from "./rss.js"
import {scan_url} from './src/scan.js'
import {persist_load, persist_save} from './persist.js'
import bodyParser from 'body-parser'
import {find_city} from './cityinfo.js'
let app = express()
app.use(cors())
app.use(bodyParser.json({limit: '50mb'}));

let PORT = 30011
let FILES_DIR = "storage"
app.set("json spaces", "  ")

let AUTH_ON = false
app.use((req, res, next) => {
    if(!AUTH_ON) return next()
    // console.log("checking ",req.headers)
    if (req.headers['access-key'] === 'testkey') {
        next();
    } else {
        res.json({
            success:false,
            message:"access-key missing or invalid"
        })
    }
})

app.get('/',(req,res)=>{
    res.json({
        status:'success',
        services:['/readability','/files','/calendar/josh','/proxy','/rss','/scan','/persist']
    })
})
app.get("/readability",(req,res)=>{
    console.log("request for",req.query.url)
    calculate_readability(req.query.url)
        .then(summary => res.json({success:true, summary, url: req.query.url}))
        .catch(e => res.json({success:false}))
})
app.get('/files/import',(req,res) => import_file(req.query.url,FILES_DIR).then(ret=>res.json(ret)))
app.get('/files/file/:id/info',(req,res) => get_file_info(req.params.id,FILES_DIR).then(ret=>res.json(ret)))
app.get('/files/list',(req,res) => list_files(FILES_DIR).then(ret=>res.json(ret)))
app.get('/files/file/:id/thumbs/:thumbid', (req,res) => get_thumbs(req.params.id, req.params.thumbid, res))
app.get('/files/file/:id/data', (req,res) => get_file_data(req.params.id, res))

// app.get('/files/',(req,res) => calculate_dir_list(req,FILES_DIR).then(files=>res.json(files)))
// app.get('/files/:filename',(req,res) => serve_file(req,FILES_DIR,res))
app.get('/rss',(req,res)=> parse_feed(req.query.url,res))
app.get('/proxy',(req,res) => proxy_url(req,res))
app.get('/calendar/josh',(req,res)=>fetch_josh_calendar().then(cal => res.json(cal)))
app.get('/scan',(req,res) => scan_url(req.query.url,res).then(d => console.log("done")))
app.post('/persist/save/:blobid',(req,res) => persist_save(req.params.blobid,req.body).then(ret => res.json(ret)))
app.get('/persist/load/:blobid',(req,res) => persist_load(req.params.blobid).then(ret => res.json(ret)))
app.get('/cityinfo',(req,res)=>{
    find_city(req.query.city,req.query.state).then(d => res.json(d))
})
app.listen(PORT,()=>{
    console.log(`listening on port ${PORT}`)
})
