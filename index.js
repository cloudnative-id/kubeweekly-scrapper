const cheerio = require('cheerio');
const fetch = require('node-fetch');


const kubeweekly = async () => {
    try {
        const data = await fetch('https://kubeweekly.io')
        return data.text()
    } catch (error) {
        return error;
    }
}

const kubeWeeklyParser = (htmlRaw) => {
    const regexElement = /<a href=(.*?) [^>]*>(.*?)<\/a>/g;
    const regexContent = /<a href=(.*?) [^>]*>(.*?)<\/a>/;

    let result = [];
    const $ = cheerio.load(htmlRaw);
    
    result.push({headline:$('#templateHeader').text()})

    let data = $('table.mcnTextBlock > tbody.mcnTextBlockOuter')
        data.toArray().map(el => {
            let content = $.html(el)
            if(content.includes("The Technical")){
               content.match(regexElement).map(e => {
                let parseData = regexContent.exec(e);
                    result.push({
                        title:parseData[2],
                        link:parseData[1]
                    })
               })
            }
    })
    return result
} 

const main = async () => {
    try {
        const kubeWeeklyContent = await kubeweekly();
        const data = kubeWeeklyParser(kubeWeeklyContent)
        console.log(data)
    } catch (error) {
        console.log(error)
    }
}

(async function() {
    await main();
})();