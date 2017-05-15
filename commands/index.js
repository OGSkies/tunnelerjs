/**
 * Automatic command loader.
 * The loader will map command execution file path and strings
 * into key object pairs.
 *
 * Author: Ari Höysniemi
 * Date: May 5. 2017
 */
const fs = require('fs');
const _ = require('lodash');
module.exports = (Debug) => {
    const module = {};
    const cmdMap = {};
    const midMap = {};

    /**
     * Loads a command from the given directory.
     * @param {string} dir
     * @return {object}
     */
    const loadCommand = (dir) => {
        // Load file paths.
        const jsPath = `./commands/${dir}/index.js`;
        const jsonPath = `./commands/${dir}/command.json`;
        // Validate files.
        if (!fs.existsSync(jsPath) || !fs.existsSync(jsonPath)) return {};
        if (!_.isFunction(require(`.${jsPath}`)().execute)) return {};
        // Validate the command.json settings file.
        const commandJSON = require(`.${jsonPath}`);
        if (
            typeof commandJSON !== 'object' ||
            typeof commandJSON.settings !== 'object' ||
            typeof commandJSON.localizations !== 'object'
        ) return {};
        // Return a command frame.
        return {
            jsPath,
            settings: commandJSON.settings,
            strings: commandJSON.localizations,
        };
    };

    /**
     * Loads a middleware from the given directory.
     * @param {string} dir
     * @return {object}
     */
    const loadMiddleware = (dir) => {
        // Load file paths.
        const jsPath = `./commands/${dir}/index.js`;
        const jsonPath = `./commands/${dir}/middleware.json`;
        // Validate files.
        if (!fs.existsSync(jsPath) || !fs.existsSync(jsonPath)) return {};
        if (!_.isFunction(require(`.${jsPath}`)().execute)) return {};
        // Validate the command.json settings file.
        const middlewareJSON = require(`.${jsonPath}`);
        if (typeof middlewareJSON !== 'object') return {};
        // Return a middleware frame.
        return {jsPath, settings: middlewareJSON};
    };

    /**
     * Loads all the available commands into a
     * command frames that can be later used to execute
     * commands.
     * @return {object}
     */
    module.initialize = () => {
        try {
            const folders = fs.readdirSync('./commands');
            folders.forEach((dir) => {
                const nameSplit = dir.split('.');
                if (nameSplit[0] === 'cmd' && nameSplit.length === 2) {
                    // Command folder.
                    const thisCmd = loadCommand(dir);
                    if (thisCmd.jsPath) {
                        cmdMap[nameSplit[1]] = thisCmd;
                        Debug.log(`Command (${nameSplit[1]}) loaded.`,
                        `COMMANDS`);
                    }
                } else if (nameSplit[0] === 'mid' && nameSplit.length === 2) {
                    // Middleware folder.
                    const thisMid = loadMiddleware(dir);
                    if (thisMid.jsPath) {
                        midMap[nameSplit[1]] = thisMid;
                        Debug.log(`Middleware (${nameSplit[1]}) loaded.`,
                        `COMMANDS`);
                    }
                }
            });
            Debug.print(
                `${Object.keys(cmdMap).length} commands loaded.`,
                'COMMANDS', false);
            Debug.print(
                `${Object.keys(midMap).length} middlewares loaded.`,
                'COMMANDS', false);
            return {cmdMap, midMap};
        } catch (e) {
            Debug.print('Indexing commands failed. The process will now exit.',
            'COMMANDS CRITICAL', true, e);
            process.exit(1);
            return {};
        }
    };

    return module;
};
