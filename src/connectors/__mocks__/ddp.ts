
// mock the ddp connector:

import {DDPClient} from "../ddpConnector"
import * as _ from "underscore"



const ddp:any = jest.genMockFromModule('ddp');


let connectionPossible = true;

ddp.prototype.__setConnectionPossible = function(possible:boolean) {
	connectionPossible = possible;
}

ddp.prototype.connect = function(cb:any) {

	

	if (connectionPossible) {
		// return true
			this.emit('connected');
		_.defer(() => {
			this.connected = true;
			cb();
		})


		
	} else {
		_.defer(() => {

			this.socket.emit('socket-close', 'mock: timeout');
		});

	}
}



module.exports = ddp;


/*
// This is a custom function that our tests can use during setup to specify
// what the files on the "mock" filesystem should look like when any of the
// `fs` APIs are used.
let mockFiles = Object.create(null);
function __setMockFiles(newMockFiles) {
  mockFiles = Object.create(null);
  for (const file in newMockFiles) {
    const dir = path.dirname(file);

    if (!mockFiles[dir]) {
      mockFiles[dir] = [];
    }
    mockFiles[dir].push(path.basename(file));
  }
}
// A custom version of `readdirSync` that reads from the special mocked out
// file list set via __setMockFiles
function readdirSync(directoryPath) {
  return mockFiles[directoryPath] || [];
}
fs.__setMockFiles = __setMockFiles;
fs.readdirSync = readdirSync;

module.exports = fs;
*/