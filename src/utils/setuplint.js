var vscode = require('vscode');
let workspaceFolders = vscode.workspace.workspaceFolders;
var filePathURI = vscode.Uri.joinPath(workspaceFolders[0].uri, `.eslintrc.json`);
var eslintConfig = {
    "env": {
        "browser": false,
        "commonjs": true,
        "es6": true,
        "node": true,
        "mocha": true
    },
    "parserOptions": {
        "ecmaVersion": 2018,
        "ecmaFeatures": {
            "jsx": true
        },
        "sourceType": "module"
    },
    "rules": {
        "no-const-assign": "warn",
        "no-this-before-super": "warn",
        "no-undef": "warn",
        "no-unreachable": "warn",
        "no-unused-vars": "warn",
        "constructor-super": "warn",
        "valid-typeof": "warn"
    }
}

var setup = () => {
    vscode.workspace.fs.readFile(filePathURI).catch(async () => {
        await vscode.workspace.fs.writeFile(filePathURI, new TextEncoder().encode(JSON.stringify(eslintConfig)))
    })
}
module.exports = { setup }