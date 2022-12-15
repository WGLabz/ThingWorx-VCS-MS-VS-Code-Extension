var vscode = require('vscode');
const gitExtension = vscode.extensions.getExtension('vscode.git').exports;
const api = gitExtension.getAPI(1);

var last_commit = async () => {
    // Get current branch
    var currentBranch = api.repositories.length > 0 ? api.repositories[0].state.HEAD : { name: api.repositories };
    var lastCommitHash = currentBranch.commit;

    // Fetch last commit object from the commit hash
    var lastCommit = await api.repositories[0].repository.getCommit(lastCommitHash);
    var diff = await api.repositories[0].repository.diffWithHEAD();
    
    return {
        branch: currentBranch.name,
        author: lastCommit.authorName,
        email: lastCommit.authorEmail,
        date: lastCommit.commitDate,
        message: lastCommit.message,
        diff
    }
}
module.exports = {
    last_commit
}