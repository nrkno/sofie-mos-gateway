
import {CoreConnection, DeviceType} from 'core-integration'

import * as _ from 'underscore'

export class CoreHandler {

	private _conn: CoreConnection

	init (): Promise<string> {

		let credentials = CoreConnection.getCredentials('mosDevice')

		this._conn = new CoreConnection(_.extend(credentials, {
			deviceType: DeviceType.MOSDEVICE,
			deviceName: 'mosDevice'
		}))

		return this._conn.init({
			host: '127.0.0.1',
			port: 3000
		})
	}
}
