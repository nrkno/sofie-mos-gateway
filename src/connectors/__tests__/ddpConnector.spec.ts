


import {DDPConnector} from "../ddpConnector"

jest.mock('ddp');


beforeEach(() => {
	// Set up some mocked out file info before each test
	//require('ddp').__setMockFiles(MOCK_FILE_INFO);
});


test('Test DDPConnector', async () => {
	
	var ddpConnector = new DDPConnector({
		host: '127.0.0.1',
		port: 3000
	});


	expect(ddpConnector).toBeInstanceOf(DDPConnector);
	

	
	await ddpConnector.connect();
	
	

	expect(ddpConnector.connected).toBe(true);

	return 1;
})

