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
    let tmp = url.trim();
    if (tmp.substr(-1) === '/') {
        tmp = tmp.substr(0, tmp.length - 1);
    };
    tmp = tmp.substring(tmp.lastIndexOf('/') + 1);

    if (isValidFileName(tmp)) {
        return tmp;
    }

    return '';
}

function isValidFileName(str) {
    str = path.basename(str);
    return /^(?!\.)(?!com\d$)(?!con$)(?!lpt\d$)(?!nul$)(?!prn$)[^|*?\\:<>/$"]*[^.|*?\\:<>/$"]+$/.test(str);
}

function isValidURL(url) {
    const valid_prefix = [
        'https://mediaklikk.hu/video/',
        'https://mediaklikk.hu/cikk/',
        'https://m4sport.hu/videok/',
        'https://m4sport.hu/videos/',
        'https://m4sport.hu/video/',
        'https://m4sport.hu/tokio2020/video/',
        'https://m4sport.hu/euro2020-video/',
        'https://m4sport.hu/bl-video/',
        'https://hirado.hu/videok/',
        'https://petofilive.hu/video/'
    ];
    for (let p of valid_prefix) {
        if (url.indexOf(p) === 0) {
            return true;
        }
    }

    return 'Az alkalmazás csak az alábbi link típusokkal működik: \n'+valid_prefix.join('* \n')+'*';
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
