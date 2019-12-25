const cheerio = require('cheerio')
const fetch = require('node-fetch')
const fs = require('fs')
const yaml = require('js-yaml')

const kubeweekly = async () => {
    try {
        const data = await fetch('https://kubeweekly.io')
        return data.text()
    } catch (error) {
        return error;
    }
}

const getKubeWeeklyContentTitle = (rawHtml) => {
    const $ = cheerio.load(rawHtml);
    return $('#templateHeader').text()
}

const getContentListTitle = (title) => {
    const regexPatternTitle = /kubeweekly(.*)#\d+/gi
    const titleContent = title.match(regexPatternTitle)[0].toLowerCase() || null
    return titleContent
}


const getFileName = (title) => {
    const name = title.replace('#','').split(' ').join('')
    return name
}

const getDateTitle = (title) => {
    const regexPatternTitle = /\w+\s\d+,\s\d+/si
    const dateParse = title.match(regexPatternTitle)
    const date = new Date(Date.parse(dateParse)).toLocaleString().slice(0,10)
    return date
}

const kubeWeeklyContentParser = (htmlRaw,contentHeadline) => {
    const regexElement = /<a href=(.*?) [^>]*>(.*?)<\/a>/g
    const regexContent = /<a href="(.*?)" [^>]*>(.*?)<\/a>/

    let result = []
    const $ = cheerio.load(htmlRaw)
    
    let data = $('table.mcnTextBlock > tbody.mcnTextBlockOuter')
        data.toArray().map(el => {
            let content = $.html(el)
                if(content.includes(contentHeadline)){
                   content.match(regexElement).map(e => {
                    let parsedData = regexContent.exec(e);
                    const contentLink = parsedData[1].replace(/\n/g, " ").trim()
                    const contentTitle = parsedData[2].replace(/\n/g, " ").trim()
                    const contentType = contentHeadline.split(' ')[1].toLowerCase()
                        result.push({
                            title:contentTitle,
                            link:contentLink,
                            type:contentType
                        })
                   })
            }
        })
    
    return result
} 

const main = async () => {
    try {
        let result = []
        let resultKubeweeklyContent = []
        const headlines = ['The Technical', 'The Editorial', 'The Headlines']
        const kubeweeklyContent = await kubeweekly();
        const kubeweeklyContentHeadlineRaw = getKubeWeeklyContentTitle(kubeweeklyContent)
        const dateTitle = getDateTitle(kubeweeklyContentHeadlineRaw)
        const contentTitle = getContentListTitle(kubeweeklyContentHeadlineRaw)

        result.push({
            title: contentTitle,
            date: dateTitle,
            source: 'kubeweekly'
        })

        headlines.map((contentHeadline) => {
           kubeWeeklyContentParser(kubeWeeklyContent, contentHeadline)
            .map(kc => {
                resultKubeweeklyContent.push(kc)
            })
        })

        result.push({data: resultKubeweeklyContent})
        return result
    } catch (error) {
        return error;
    }
}

main().then(data => {
    let existingContent = yaml.safeLoad(fs.readFileSync('./contentList.yaml','utf8'));
    let header = data.shift()
    const found = existingContent.contentList.some(el => el.date === header.date);
    if (!found) {
        const content = {
            ...header,
            ...data[0]
        }
        
        const name = './contents/' + getFileName(header.title) + '.yaml';
        existingContent.contentList.push({
            title: header.title,
            tags: ["#kubereads"],
            date: header.date,
            status: 'not delivered',
            content: name
        })

        let kubeweeklyContentYAML = yaml.safeDump(content)
        let kubeweeklyContentListYAML = yaml.safeDump(existingContent)
        fs.writeFileSync(name, kubeweeklyContentYAML, 'utf8')
        fs.writeFileSync('./contentList.yaml', kubeweeklyContentListYAML,'utf8')

        console.log('Kubeweekly.yaml updated.')
    } else {
        console.log('Kubeweekly not updated.')
    }
})
