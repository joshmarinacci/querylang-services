
import ical from 'ical'
import fs from 'fs'
import fetch from 'node-fetch'

export  async function fetch_josh_calendar() {
    let url = "https://calendar.google.com/calendar/ical/joshua%40marinacci.org/public/basic.ics"
    let raw = await fetch(url).then(r => r.text())
// console.log('data is',raw)
    const data = ical.parseICS(raw)
// console.log("data is",data)
// console.log("data length",data.length)


    let results = []
    for (let k in data) {
        if (data.hasOwnProperty(k)) {
            const ev = data[k]
            if (ev.type === 'VEVENT') {
                console.log(`event ${ev.summary}`)
                results.push(ev)
            }
        }
    }

    return results
}