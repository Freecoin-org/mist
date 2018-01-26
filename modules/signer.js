// ∆∆∆ TODO: remove. This is for debugging - logs out spawn args
(function() {
	var childProcess = require("child_process");
	var oldSpawn = childProcess.spawn;
	function mySpawn() {
		console.log('spawn called');
		console.log(arguments);
		var result = oldSpawn.apply(this, arguments);
		return result;
	}
	childProcess.spawn = mySpawn;
})();

const spawn = require('child_process').spawn;
const path = require('path');
const logger = require('./utils/logger');
const signerLog = logger.create('Signer');

class Signer {
	get chainId() {
		switch (store.getState().nodes.network) {
			case 'main':
				return 1;
			case 'test':
				// fall-through
			case 'ropsten':
				return 3;
			case 'rinkeby':
				return 4;
			case 'kovan':
				return 42;
		}
	}

	get keystorePath() {
		const network = store.getState().nodes.network;
        console.log('∆∆∆ network', network);
		let basePath;
		switch (process.platform) {
			case 'darwin':
                basePath = path.join('/Library', 'Ethereum');
				break;
			case 'sunos':
				// fall-through
			case 'linux':
				basePath = path.join('.ethereum');
				break;
			case 'win32':
				basePath = path.join(process.env.APPDATA, 'Ethereum');
        }

		if (network === 'main') {
			return path.join(basePath, 'keystore');
		} else if (network === 'rinkeby') {
			return path.join(basePath, 'rinkeby', 'keystore');
		} else {
			return path.join(basePath, 'testnet', 'keystore');
		}
	}

    async sign(data, pw, callback) {
        console.log('∆∆∆ this.keystorePath', this.keystorePath);
        console.log('∆∆∆ this.chainId', this.chainId);
        // this.signer = spawn('../signerBin/signer', ['-keystore', this.keystorePath, '-chainid', this.chainId, '-stdio-ui']);

        // TODO: "{keystore} no such file or directory"
        this.signer = spawn('./signerBin/signer', [
            '-4bytedb', './signerBin/4byte.json',
            '-keystore', './keystoreTest',
            '-chainid', 4
        ]);

        const req = {
            method: 'account_signTransaction',
            params: [data.from, pw, data],
        };

        this.signer.stdout.on('data', (data) => {
            const signerStdout = data.toString();
            signerLog.log(`signerStdout: ${signerStdout}`);
            console.log('∆∆∆ signerStdout', signerStdout);

            callback(signerStdout);
        });

        this.signer.stderr.on('data', (data) => {
            signerLog.error(`stderr: ${data.toString()}`);
        });

        // Example request:
		// request.method = 'account_signTransaction';
		// request.params = [address, pw, {
			// nonce: "0x0",
			// gasPrice: "0x1234",
			// gas: "0x55555",
			// value: "0x1234",
			// input: "0xabcd",
			// to: "0x07a565b7ed7d7a678680a4c162885bedbb695fe0"
		// }];

        console.log('∆∆∆ writing request to be stringifyd', req);
        this.signer.stdin.write(JSON.stringify(req));
    }
}

export default new Signer();
