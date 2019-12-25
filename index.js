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

const kubeWeeklyContentTitle = (htmlRaw) => {
    const $ = cheerio.load(htmlRaw);
    
    return $('#templateHeader').text()
}
const contentListTitle = (title) => {
    const regexPatternTitle = /kubeweekly(.*)#\d+/gi
    const titleContent = title.match(regexPatternTitle)[0].toLowerCase() || null;
    const yamlFileName = titleContent.replace('#','').split(' ').join('')
    return titleContent;
}
const yamlFileName = (title) => {
    const yamlName = title.replace('#','').split(' ').join('')
    return yamlName;
}
const getDateTitle = (title) => {
    const regexPatternTitle = /\w+\s\d+,\s\d+/si
    const dateParse = title.match(regexPatternTitle)
    const date = new Date(Date.parse(dateParse)).toLocaleString().slice(0,10)
    return date;
}

const kubeWeeklyContentParser = (htmlRaw,contentHeadline) => {
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
                    const contentLink = parseData[1].replace(/\n/g, " ").trim()
                    const contentTitle = parseData[2].replace(/\n/g, " ").trim()
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
        const headlines =['The Technical','The Editorial','The Headlines']
        const kubeWeeklyContent = await kubeweekly();
        const kubeWeeklyContentHeadlineRaw = kubeWeeklyContentTitle(kubeWeeklyContent)
        const dateTitle = getDateTitle(kubeWeeklyContentHeadlineRaw)
        const contentTitle = contentListTitle(kubeWeeklyContentHeadlineRaw)
        result.push({
            title:contentTitle,
            date:dateTitle,
            source:'kubeweekly'
        })
        headlines.map((contentHeadline) => {
           kubeWeeklyContentParser(kubeWeeklyContent,contentHeadline)
            .map(contentKubeweekly => {
                resultKubeweeklyContent.push(contentKubeweekly)
            })
        })
        result.push({data:resultKubeweeklyContent})
        return result
    } catch (error) {
        return error;
    }
}

main().then(data => {
    let existingContentYaml = yaml.safeLoad(fs.readFileSync('./contentList.yaml','utf8'));
    let headerContent = data.shift()
    const found = existingContentYaml.contentList.some(el => el.date === headerContent.date);
    if(!found){
        let content = {
            ...headerContent,
            ...data[0]
        }
        const yamlName = './contents/'+yamlFileName(headerContent.title)+'.yaml';
        existingContentYaml.contentList.push({
            title: headerContent.title,
            tags: ["#kubereads"],
            date: headerContent.date,
            status: 'not delivered',
            content: yamlName
        })
        let kubeweeklyContentYAML = yaml.safeDump(content);
        let kubeweeklyContentListYAML = yaml.safeDump(existingContentYaml);
        fs.writeFileSync(yamlName, kubeweeklyContentYAML, 'utf8');
        fs.writeFileSync('./contentList.yaml',kubeweeklyContentListYAML,'utf8')
        console.log('kubeweekly.yaml updated')
    }else console.log('kubeweekly not updated')
})