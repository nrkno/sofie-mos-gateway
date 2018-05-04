
import { Connector } from '../connector'
import * as Winston from 'winston'

test('Simple test', async () => {
	let c: Connector

	let logger = new Winston.Logger({
		transports: [
			new Winston.transports.Console()
		]
	})

	c = new Connector(logger)

	await c.init({
		core: {
			host: '127.0.0.1',
			port: 3000
		},
		mos: {
			self: {
				mosID: 'test.tv.automation',
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
			devices: []
		}
	})

	expect(c).toBeInstanceOf(Connector)
	await c.dispose()
	expect(1).toEqual(1)
	// Todo: check that all socket connections have been closed
})
