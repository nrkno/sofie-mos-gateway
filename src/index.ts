
import { Connector, Config } from './connector'

// CLI arguments / Environment variables --------------
let host: string 		= process.env.CORE_HOST 					|| '127.0.0.1'
let port: number 		= parseInt(process.env.CORE_PORT + '', 10) 	|| 3000
let logPath: string 	= process.env.CORE_LOG						|| ''

logPath = logPath

let prevProcessArg = ''
process.argv.forEach((val) => {
	if (prevProcessArg.match(/-host/i)) {
		host = val
	} else if (prevProcessArg.match(/-port/i)) {
		port = parseInt(val, 10)
	} else if (prevProcessArg.match(/-log/i)) {
		logPath = val
	}
	prevProcessArg = val + ''
})

// App config -----------------------------------------
let config: Config = {
	core: {
		host: host,
		port: port
	},
	mos: {
		self: {

			mosID: 'sofie.tv.automation',
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

console.log('------------------------------------------------------------------')
console.log('Starting MOS Gateway')
let c = new Connector()

console.log('Core:          ' + config.core.host + ':' + config.core.port)
console.log('Mos id:        ' + config.mos.self.mosID)
config.mos.devices.forEach((device) => {
	if (device.primary) console.log('Mos Primary:   ' + device.primary.host)
	if (device.secondary) console.log('Mos Secondary: ' + device.secondary.host)
})
console.log('------------------------------------------------------------------')
c.init(config)
