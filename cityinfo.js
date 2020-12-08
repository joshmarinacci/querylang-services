import {promises} from "fs";
// country is in https://en.wikipedia.org/wiki/ISO_3166
// lat lon is in decimal
// timezone is in UTC offsets
// state is full name
// abbreviations are expanded


export async function find_city(city, state) {
    console.log("finding",city,state)
    let data = await promises.readFile("cityinfo.json")
    let DATA = JSON.parse(data.toString())
    console.log('data is',DATA)
    return DATA.find((item => {
        return item.city.toLowerCase() === city.toLowerCase()
    }))
}