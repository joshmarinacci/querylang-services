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
        // console.log("got the meta",meta)
        data.meta = {
            title:meta.title,
            description:meta.description,
            link:meta.xmlurl,
            tags:[],
            is_podcast:false
        }
        if(meta.image && meta.image.url) {
            data.meta.image = meta.image.url
        }
        if(meta.categories) {
            data.meta.tags = meta.categories.slice()
        }
        if(meta['itunes:type'] && meta['itunes:type']['#'] === 'episodic') {
            data.meta.is_podcast = true
        }
    })
    feedparser.on('readable',function() {
        // console.log("got readable")
        // let meta = this.meta
        // console.log('meta is',this.meta)
        let item
        let stream = this
        while(item = stream.read()) {
            // console.log("Item is",item)
            let post = {
                title:item.title,
                description: item.description,
                summary:item.summary,
                date:item.date,
                permalink:item.link,
                guid:item.guid,
            }

            // console.log(item)
            const ITD = 'itunes:duration'
            if(item[ITD] && item[ITD]['#']) {
                // console.log("ITD",item[ITD])
                post.duration = parseInt(item[ITD]['#'])
                // console.log("parsed duration",post.duration)
            }
            if(item.image && item.image.url) {
                post.image = item.image.url
            }
            post.enclosures = item.enclosures || []
            data.posts.push(post)
        }
    })
    feedparser.on('end',function() {
        // console.log("it's over!")
        res.json(data)
    })
}