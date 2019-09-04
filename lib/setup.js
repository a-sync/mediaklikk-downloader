'use strict';

const path = require('path');
const inquirer = require('inquirer');
const cmdArgs = require('minimist')(process.argv.slice(2));

const dateObj = new Date();

function parseCmdArgs() {
    return new Promise((resolve, reject) => {
        if (!Object.prototype.hasOwnProperty.call(cmdArgs, 'url')) {
            return reject(new Error('Nem lett megadva oldal link!'));
        }

        const urlCheck = isValidURL(String(cmdArgs.url));
        if (urlCheck !== true) {
            return reject(new Error(urlCheck));
        }

        const defaultName = parseFileNameFromMediaklikkUrl(cmdArgs.url) || String(dateObj.getTime());
        if (!Object.prototype.hasOwnProperty.call(cmdArgs, 'output') ||
            (String(cmdArgs.output).slice(-1) !== path.sep && !isValidFileName(String(cmdArgs.output)))) {
            cmdArgs.output = defaultName;
        }

        const fileName = createProperFileName(String(cmdArgs.output), defaultName);

        return resolve({url: cmdArgs.url, file: fileName});
    });
}

module.exports.parseCmdArgs = parseCmdArgs;

function showPrompts() {
    return inquirer.prompt([
        {
            name: 'url',
            message: 'Oldal link:',
            validate: isValidURL
        }
    ])
        .then(params1 => {
            const defaultFileName = parseFileNameFromMediaklikkUrl(params1.url) || String(dateObj.getTime());
            /* Ne kérdezzen rá a fájlnévre, csak ha muszáj:
            if (defaultFileName) {
                return {url: params1.url, file: defaultFileName + '.mp4'};
            }
            */
            return inquirer.prompt([{
                name: 'file',
                message: 'Fájl név:',
                default: defaultFileName,
                validate: val => {
                    if (val.slice(-1) === path.sep) {
                        return true;
                    }

                    return isValidFileName(val);
                },
                filter: val => {
                    return createProperFileName(val, defaultFileName);
                }
            }])
                .then(params2 => {
                    return {url: params1.url, file: params2.file};
                });
        })
        .catch(err => {
            // Debug: console.error(err.message);
            throw new Error('Hiba az adatok bekérésénél!');
        });
}

module.exports.showPrompts = showPrompts;

function showMediaSelector(videoUrls, selected) {
    const choices = videoUrls.map(c => {
        return {
            name: c,
            value: c
        };
    });

    return inquirer.prompt([{
        type: 'list',
        name: 'media',
        message: 'Videó URL',
        default: selected,
        choices
    }])
        .catch(err => {
            // Debug: console.error(err.message);
            throw new Error('Hiba az adatok bekérésénél!');
        });
}

module.exports.showMediaSelector = showMediaSelector;

function parseFileNameFromMediaklikkUrl(url) {
    let tmp = url.split('/video/');

    if (Array.isArray(tmp) && tmp.length > 1) {
        tmp = tmp[1].split('/')[0];

        if (isValidFileName(tmp)) {
            return tmp;
        }
    }

    return '';
}

function isValidFileName(str) {
    str = path.basename(str);
    return /^(?!\.)(?!com\d$)(?!con$)(?!lpt\d$)(?!nul$)(?!prn$)[^|*?\\:<>/$"]*[^.|*?\\:<>/$"]+$/.test(str);
}

function isValidURL(url) {
    if (url.indexOf('https://www.mediaklikk.hu/video/') === 0 || url.indexOf('https://www.m4sport.hu/videok/') === 0) {
        return true;
    }

    return 'Az alkalmazás csak https://www.mediaklikk.hu/video/* és https://www.m4sport.hu/videok/ oldalakkal működik!';
}

function createProperFileName(fileName, defaultName) {
    if (!fileName) {
        fileName = defaultName;
    } else if (fileName.slice(-1) === path.sep) {
        fileName += defaultName;
    }

    if (!fileName.slice(-4) === '.mp4') {
        return fileName;
    }

    return fileName + '.mp4';
}