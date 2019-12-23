const cheerio = require('cheerio');
const fetch = require('node-fetch');
const fs = require('fs');
const yaml = require('js-yaml');

const kubeweekly = async () => {
    try {
        const data = await fetch('https://kubeweekly.io')
        return data.text()
    } catch (error) {
        return error;
    }
}
const kubeWeeklyContentTitle = async (htmlRaw) => {
    const $ = cheerio.load(htmlRaw);
    
    return $('#templateHeader').text()
}
const kubeWeeklyParser = (htmlRaw,contentHeadline) => {
    const regexElement = /<a href=(.*?) [^>]*>(.*?)<\/a>/g;
    const regexContent = /<a href="(.*?)" [^>]*>(.*?)<\/a>/;

    let result = [];
    const $ = cheerio.load(htmlRaw);
    
    let data = $('table.mcnTextBlock > tbody.mcnTextBlockOuter')
        data.toArray().map(el => {
            let content = $.html(el)
                if(content.includes(contentHeadline)){
                   content.match(regexElement).map(e => {
                    let parseData = regexContent.exec(e);
                        result.push({
                            title:parseData[2].trim(),
                            link:parseData[1].trim()
                        })
                   })
            }
        })
    
    return result
} 

const main = async () => {
    try {
        let result = []
        const headlines =['The Technical','The Editorial','The Headlines']
        const kubeWeeklyContent = await kubeweekly();
        const kubeWeeklyContentHeadline = await kubeWeeklyContentTitle(kubeWeeklyContent);
        result.push({title:kubeWeeklyContentHeadline})
        headlines.map((contentHeadline) => {
            const kubeweeklyData = kubeWeeklyParser(kubeWeeklyContent,contentHeadline)
            result.push({
                headline:contentHeadline,
                data:kubeweeklyData
            })
        })
        return result
    } catch (error) {
        return error;
    }
}

main().then(data => {
    let kubeweeklyYAML = yaml.safeDump(data);
    fs.writeFileSync('kubeweekly.yaml', kubeweeklyYAML, 'utf8');
    console.log('kubeweekly.yaml updated')
})