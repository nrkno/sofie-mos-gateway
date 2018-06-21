
import { Connector, Config } from './connector'
import * as Winston from 'winston'

// CLI arguments / Environment variables --------------
let host: string 		= process.env.CORE_HOST 					|| '127.0.0.1'
let port: number 		= parseInt(process.env.CORE_PORT + '', 10) 	|| 3000
let logPath: string 	= process.env.CORE_LOG						|| ''
let deviceId: string 	= process.env.DEVICE_ID						|| ''
let deviceToken: string = process.env.DEVICE_TOKEN 				|| ''
let debug: boolean 		= false

logPath = logPath

let prevProcessArg = ''
process.argv.forEach((val) => {
	if (prevProcessArg.match(/-host/i)) {
		host = val
	} else if (prevProcessArg.match(/-port/i)) {
		port = parseInt(val, 10)
	} else if (prevProcessArg.match(/-log/i)) {
		logPath = val
	} else if (prevProcessArg.match(/-id/i)) {
		deviceId = val
	} else if (prevProcessArg.match(/-token/i)) {
		deviceToken = val
	} else if ((val + '').match(/-debug/i)) {
		debug = true
	}
	prevProcessArg = val + ''
})

// Setup logging --------------------------------------
let logger = new (Winston.Logger)({
})

if (logPath) {
	// Log json to file, human-readable to console
	console.log('Logging to', logPath)
	logger.add(Winston.transports.Console, {
		level: 'verbose',
		handleExceptions: true,
		json: false
	})
	logger.add(Winston.transports.File, {
		level: 'debug',
		handleExceptions: true,
		json: true,
		filename: logPath
	})
	// Hijack console.log:
	// @ts-ignore
	let orgConsoleLog = console.log
	console.log = function (...args: any[]) {
		// orgConsoleLog('a')
		if (args.length >= 1) {
			// @ts-ignore one or more arguments
			logger.debug(...args)
			orgConsoleLog(...args)
		}
	}
} else {
	console.log('Logging to Console')
	// Log json to console
	logger.add(Winston.transports.Console,{
		level: 'verbose',
		handleExceptions: true,
		json: true,
		stringify: (obj) => JSON.stringify(obj) // make single line
	})
	// Hijack console.log:
	// @ts-ignore
	let orgConsoleLog = console.log
	console.log = function (...args: any[]) {
		// orgConsoleLog('a')
		if (args.length >= 1) {
			// @ts-ignore one or more arguments
			logger.debug(...args)
		}
	}
}

// Because the default NodeJS-handler sucks and wont display error properly
process.on('unhandledRejection', (e: any) => {
	logger.error('Unhandled Promise rejection:', e, e.reason || e.message, e.stack)
})
process.on('warning', (e: any) => {
	logger.warn('Unhandled warning:', e, e.reason || e.message, e.stack)
})

logger.info('------------------------------------------------------------------')
logger.info('Starting MOS Gateway')
// App config -----------------------------------------
let config: Config = {
	device: {
		deviceId: deviceId,
		deviceToken: deviceToken
	},
	core: {
		host: host,
		port: port
	},
	mos: {
		self: {
			debug: debug,
			// mosID: 'sofie.tv.automation',
			mosID: 'N/A', // set by Core
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
		}
		// devices: [{
		// 	primary: {
		// 		id: '2012R2ENPS8VM',
		// 		host: '10.0.1.244'
		// 	}
		// 	/*secondary?: {
		// 		ncsID: string;
		// 		host: string;
		// 	},*/
		// }]
	}
}

let c = new Connector(logger)

logger.info('Core:          ' + config.core.host + ':' + config.core.port)
// logger.info('My Mos id:     ' + config.mos.self.mosID)
// config.mos.devices.forEach((device) => {
// 	if (device.primary) logger.info('Mos Primary:   ' + device.primary.host)
// 	if (device.secondary) logger.info('Mos Secondary: ' + device.secondary.host)
// })
logger.info('------------------------------------------------------------------')
c.init(config)
.catch(logger.error)
