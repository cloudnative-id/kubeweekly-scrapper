require('dotenv').config()
const git = require('simple-git');
const REPO = 'github.com/cloudnative-id/kubeweekly-scrapper'
const remote = `https://${process.env.USER}:${process.env.PASS}@${REPO}`;
const pull = () =>{
        git() 
        .addConfig('user.name', 'cncfidbot')
        .addConfig('user.email', 'cncfidbot@gmail.com')
        .removeRemote('github')
        .addRemote('github', remote)
        .pull('github','master')
}

const push = (filename) => {
    git()
    .add('./*')
    .commit(`update yaml (${filename})`)
    .push(['-u', 'github', 'master'], () => console.log('update done'));
}

module.exports = {
    pull,
    push
}