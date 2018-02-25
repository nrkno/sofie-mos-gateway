


import {Connector} from "../connector"

test('Simple test', async () => {
	
	var c = new Connector();

	await c.init()

	expect(c).toBeInstanceOf(Connector)

	return 1;
})
