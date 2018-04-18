
import {Connector, Config} from './connector'

console.log('------------------------------------------------------------------')
console.log('Starting MOS Gateway')
let c = new Connector()

let config: Config = {
	core: {
		host: '127.0.0.1',
		port: 3000
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
				host: '10.0.1.244'
			}
			/*secondary?: {
				ncsID: string;
				host: string;
			},*/
		}]
	}
}
console.log('Core:          ' + config.core.host + ':' + config.core.port)
config.mos.devices.forEach((device) => {
	if (device.primary) console.log('Mos Primary:   ' + device.primary.host)
	if (device.secondary) console.log('Mos Secondary: ' + device.secondary.host)
})
console.log('------------------------------------------------------------------')
c.init(config)
