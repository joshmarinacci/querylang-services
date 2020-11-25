import fetch from 'node-fetch'

import metascraper0 from 'metascraper'
import ms_author from 'metascraper-author'
import ms_desc from 'metascraper-description'
import ms_date from 'metascraper-date'
import ms_image from "metascraper-image"
import ms_logo from "metascraper-logo"
import ms_title from "metascraper-title"
import ms_lang from "metascraper-lang"
import ms_url from "metascraper-url"
import ms_favicon from "metascraper-logo-favicon"

function josh_rss_detector() {
    const rules = {
        feed: [
            // They receive as parameter:
            // - `htmlDom`: the cheerio HTML instance.
            // - `url`: The input URL used for extact the content.
            ({ htmlDom: $, url }) => $('link[type="application/rss+xml"]').attr('href'),
            // ({ htmlDom: $, url }) => $('meta[itemprop="logo"]').attr('content')
        ]
    }
    return rules
}

const metascraper = metascraper0([
    ms_author(),
    ms_date(),
    ms_desc(),
    ms_image(),
    ms_logo(),
    ms_lang(),
    ms_title(),
    ms_url(),
    ms_favicon(),
    josh_rss_detector(),
])

export function scan_url(url, res) {
    console.log("scanning",url)
    let info = {}
    fetch(url).then(req => {
        console.log("okay is", req.ok)
        // console.log("request headers is",req.headers)
        console.log("content type is", req.headers.get('content-type'))
        console.log("real url is",req.url,req.useFinalURL)
        info.mimetype = req.headers.get("content-type")
        return req.text()
    }).then(html => {
        // console.log("html is",html)
        return metascraper({html,url})
    }).then(meta => {
        console.log("scanned is",meta)
        res.json(Object.assign(meta,info))
    })

}