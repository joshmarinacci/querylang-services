import FeedParser from "feedparser"
import fetch from "node-fetch"


export function parse_feed(url,res) {
    console.log("parsing the feed",url)
    let feedparser = new FeedParser()
    let data = {
        meta:{},
        posts:[]
    }

    fetch(url).then(r => {
        if(r.status !== 200) throw new Error(`Bad status code at ${url}`)
        r.body.pipe(feedparser)
    })

    feedparser.on('error',(er)=>{
        console.log("errors",er)
    })
    feedparser.on('meta',meta => {
        console.log("got the meta",meta)
        data.meta = {
            title:meta.title,
            description:meta.description,
            link:meta.xmlurl,
        }
    })
    feedparser.on('readable',function() {
        console.log("got readable")
        // let meta = this.meta
        // console.log('meta is',this.meta)
        let item
        let stream = this
        while(item = stream.read()) {
            // console.log("Item is",item)
            data.posts.push({
                title:item.title,
                description: item.description,
                summary:item.summary,
                date:item.date,
                permalink:item.permalink,
                guid:item.guid,
            })

        }
    })
    feedparser.on('end',function() {
        console.log("it's over!")
        res.json(data)
    })
}