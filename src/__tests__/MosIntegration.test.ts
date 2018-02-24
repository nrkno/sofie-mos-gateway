


import MosIntegration from "../MosIntegration"

test('Simple test', () => {
	
	var myMosC = new MosIntegration();

	MosIntegration.init();

	expect(myMosC).toBeInstanceOf(MosIntegration)
})
