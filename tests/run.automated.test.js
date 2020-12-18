import { spawn } from 'child_process'
import fs from "fs"
import path from 'path'

async function doRun(cmd, args, cwd, title) {
    let fcwd = path.join(process.cwd(),cwd)
    console.log("starting",cmd,args,'in',cwd)
    const child = spawn(cmd, args,{cwd:fcwd});
    child.on('exit', code => {
        console.log(`Exit code is: ${code}`);
    });
    if(!title) title = cmd
    child.stdout.on('data',(str)=>{
        console.log(title,":",str.toString().split("\n").join("\n"+title+":"))
    })
    child.stderr.on('data',(str)=>{
        console.log(title,":",str.toString().split("\n").join("\n"+title+":"))
    })

}

function doWait(number) {
    console.log('waiting',number)
    return new Promise((res,rej)=> setTimeout(res,number))
}

async function nuke_and_rebuild(path) {
    await (fs.promises.rm(path,{recursive:true}))
    await fs.promises.mkdir(path)
}

async function go() {
    await nuke_and_rebuild("storage")
    await doRun('http-server', ['.'], '../querylang-testdata','webserver')
    await doWait(3000)
    await doRun('npm',['start'],'.','server')
    await doWait(3000)
    await doRun('node',['tests/ingestremote.test.js'],'','test')
}

go().then(()=>console.log("finished"))
