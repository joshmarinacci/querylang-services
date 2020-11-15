import {calculateInfo} from './readability-example.js'

import cors from 'cors'
import express from "express"

let app = express()
app.use(cors())
let PORT = 30011
app.set("json spaces", "  ")

app.get("/readability",(req,res)=>{
    console.log("request for",req.query.url)
    calculateInfo(req.query.url)
        .then(summary => res.json({success:true, summary, url: req.query.url}))
        .catch(e => res.json({success:false}))
})
app.listen(PORT,()=>{
    console.log(`listening on port ${PORT}`)
})
