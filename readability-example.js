
import {Readability} from '@mozilla/readability'
import fetch  from 'node-fetch'
import {JSDOM} from "jsdom"




export function calculateInfo(url) {
    return fetch(url)
        .then(res => res.text())
        .then(body => {
            const doc = new JSDOM(body, {url: url });
            console.log("got doc")
            try {
                let reader = new Readability(doc.window.document);
                console.log("parsing")
                return reader.parse()
            } catch (e) {
                console.log("got an error",e)
            }
        })
        .catch(e => {
            console.log("error",e)
        })
        .then(summary => {
            console.log("title is", summary.title)
            console.log("excerpt is", summary.excerpt)
            console.log("length is", summary.length)
            console.log("content is", summary.textContent.substring(0, 255))
            return summary
        })
}
