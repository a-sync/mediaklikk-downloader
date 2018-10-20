#!/usr/bin/env node
process.title = 'github.com/a-sync/mediaklikk-downloader';

const ora = require('ora');

const {setup, parser, downloader} = require('..');

if (process.argv.length > 2) {
    setup.parseCmdArgs().then(download).catch(() => {});
} else {
    setup.showPrompts().then(download).catch(() => {});
}

async function download(params) {
    const videoUrls = await parser.load(params.url);
    // Debug: console.debug(JSON.stringify(videoUrls, null, 2));

    if (Array.isArray(videoUrls) && videoUrls.length > 0) {
        const targetUrls = await checkSources(videoUrls);
        // Debug: console.debug(JSON.stringify(targetUrls, null, 2));

        if (process.argv.length > 2 || targetUrls.length > 0) {
            if (targetUrls.length === 0) {
                throw new Error('Nem található letölthető url.');
            }

            return downloader.download(targetUrls.pop(), params.file);
        }

        const selected = await setup.showMediaSelector(videoUrls, 0);
        return downloader.download(selected.media, params.file);
    }
}

async function checkSources(videoUrls) {
    const spinner = ora('Url-ek ellenőrzése...').start();
    const urls = [];

    const targetUrl = videoUrls
        .find(url => {
            return (url.indexOf('/index.smil/') !== -1);
        });

    if (targetUrl) {
        const targetCheck = await downloader.check(targetUrl);
        if (targetCheck.meta) {
            urls.push(targetUrl);
        }
    }

    if (urls.length === 0) {
        spinner.fail('Nem található letölthető url.');
    } else {
        spinner.succeed(urls.length + ' db letölthető url.');
    }

    return urls;
}
