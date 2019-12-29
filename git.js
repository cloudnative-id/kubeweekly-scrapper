require('dotenv').config()
const git = require('simple-git');
const REPO = 'github.com/cloudnative-id/kubeweekly-scrapper'
const remote = `https://${process.env.USER}:${process.env.PASS}@${REPO}`;
const pull = () =>{
        git() 
        .addConfig('user.name', 'cncfidbot')
        .addConfig('user.email', 'cncfidbot@gmail.com')
        .listRemote([['--get-url']],(err,data) => {
                if (data !== remote){
                    git().addRemote('origin',remote)
                }
        })
        .pull('origin','master')
}

const push = (filename) => {
    git()
    .add('./*')
    .commit(`update yaml (${filename})`)
    .push(['-u', 'origin', 'master'], () => console.log('update done'));
}

module.exports = {
    pull,
    push
}