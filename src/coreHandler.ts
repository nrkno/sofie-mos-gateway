import {DDPConnector} from "./connectors/ddpConnector"


export class CoreHandler {

	private ddp:DDPConnector;

	init() {

		this.ddp = new DDPConnector({
			host: '127.0.0.1',
			port: 3000,
		});

		this.ddp.createClient();

	}
}