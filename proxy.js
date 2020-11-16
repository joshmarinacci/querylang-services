import fetch from "node-fetch"
export async function proxy_url(req, res) {
    console.log("proxying", req.query.url)
    let resp = await fetch(req.query.url)
    let ct = resp.headers.get('content-type')
    console.log("content type is",ct)
    let buf = await resp.buffer()
    res.set('Content-Type',ct)
    res.send(buf)
}
