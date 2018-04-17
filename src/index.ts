
import {Connector, Config} from './connector'

console.log('Running MOS-integration...')
let c = new Connector()

let config: Config = {
	core: {
		host: '127.0.0.1',
		port: 3010
	},
	mos: {
		self: {

			mosID: 'seff.tv.automation',
			acceptsConnections: true, // default:true
			// accepsConnectionsFrom: ['127.0.0.1'],
			profiles: {
				'0': true,
				'1': true,
				'2': true,
				'3': false,
				'4': false,
				'5': false,
				'6': false,
				'7': false
			}
		},
		devices: [{
			primary: {
				id: '2012R2ENPS8VM',
				host: '10.0.1.248'
			}
			/*secondary?: {
				ncsID: string;
				host: string;
			},*/
		}]
	}
}
c.init(config)
