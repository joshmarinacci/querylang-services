import {calculateInfo} from './readability-example.js'

import cors from 'cors'
import express from "express"
import {calculateDirectoryList} from './files.js'
import {fetch_josh_calendar} from './ical.js'

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
    calculateInfo(req.query.url)
        .then(summary => res.json({success:true, summary, url: req.query.url}))
        .catch(e => res.json({success:false}))
})
app.get('/files',(req,res) => {
    console.log("files request")
    calculateDirectoryList(FILES_DIR).then(files=>res.json(files))
})
app.get('/calendar/josh',(req,res)=>{
    console.log("fetching the calendar")
    fetch_josh_calendar().then(cal => res.json(cal))
})
app.listen(PORT,()=>{
    console.log(`listening on port ${PORT}`)
})
