import {MosConnection} from "mos-connection"

export class MosHandler {

	public mos:MosConnection;

	init() {

		this.mos = new MosConnection({
			acceptConnections: true, // default:true
			acceptConnectionFrom: ['127.0.0.1'],
			
			profiles: {
				'0': true,
				'1': false,
				'2': false,
				'3': false,
				'4': false,
				'5': false,
				'6': false,
				'7': false,
			}
		});

		this.mos.onConnection(() => {
			// a new connection has been made



		});

		// Connect to ENPS:
		return this.mos.connect({
			ncs: {
				ncsID: "WINSERVERSOMETHINGENPS",
				host: "192.168.0.1"
			},
			/*ncsBuddy?: {
				ncsID: string;
				host: string;
			},*/
		}).then(() => {
			// called when a connection has been made
		})
	}
}