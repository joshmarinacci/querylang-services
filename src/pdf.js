import fs from 'fs'
import pdf_lib from 'pdfjs-dist/es5/build/pdf.js'
const {getDocument} = pdf_lib
// import PureImage from "pureimage"

export async function render_page_to_png(filepath,outpath)
{

    let doc = await getDocument(filepath).promise
    let metadata = await doc.getMetadata()
    console.log("metadata is",metadata)

    let page = await doc.getPage(1)
    let content = await page.getTextContent()
    // Content contains lots of information about the text layout and
    // styles, but we need only strings at the moment
    var strings = content.items.map(function (item) {
        return item.str;
    });
    console.log("## Text Content");
    // console.log(strings.join("\n"));
    let text = strings.join("\n")
    if(text.length > 500)  text = text.substring(0,500)
    await fs.promises.writeFile(outpath,text)
    console.log("done writing to ",outpath,text)
    return outpath


    /*
    // console.log("page is",page)
    let scale = 1.5;
    let viewport = page.getViewport({scale: scale,});
    // console.log("viewport",viewport)

    let canvas = PureImage.make(viewport.width, viewport.height);
    let context = canvas.getContext('2d');
    context.canvas = canvas
    // console.log("context is",context)
    let renderContext = {
        canvasContext: context,
        viewport: viewport
    };
    let res = await page.render(renderContext).promise;*/
    // console.log('done rendering')
}

// render_page_to_png("../querylang-testdata/pdfs/20reasons.pdf","pdf.txt").then(()=>{
//     console.log("we are done")
// })
// render_page_to_png("../querylang-testdata/pdfs/object-focus.pdf","pdf.txt").then(()=>{
//
// })
