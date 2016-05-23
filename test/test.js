describe('breeze-json-api-uribuilder', function() {

	var uriBuilder = {};
	var manager = {};

	var executeQuery = function(query) {
		return uriBuilder.buildUri(query, manager.metadataStore)
	}

	before(function() {
		breeze.config.initializeAdapterInstances({
			uriBuilder: "json-api"
		});
		const ds = new breeze.DataService({
			serviceName: 'http://localhost:9000',
			hasServerMetadata: false
		});

		manager = new breeze.EntityManager({
			dataService: ds
		});

		uriBuilder = breeze.config.getAdapterInstance("uriBuilder", 'json-api');
	});

	describe('breeze.EntityQuery().from("persons")', function() {
		it('should return the URI for the persons endpoint', function() {

			const expectedURI = 'persons';
			const query = new breeze.EntityQuery().from("persons");

			expect(executeQuery(query), 'Get all Persons').equal(expectedURI);
		});
	});

	describe('breeze.EntityQuery().from("persons").where("ID", "==", "12345");', function() {
		it('should return the URI for a specific person', function() {

			const expectedURI = 'persons/12345';
			const query = new breeze.EntityQuery().from("persons").where("ID", "==", "12345");

			expect(executeQuery(query), "Get specific person").equal(expectedURI);
		});
	});

	describe('breeze.EntityQuery().from("persons").where("name", "startsWith", "A")', function() {
		it('should throw an error: startsWith isnt supported', function() {

			const query = new breeze.EntityQuery().from("persons").where('name', 'startsWith', 'A');
			expect(executeQuery(query)).to.throw(new Error('startsWith is not supported by JSON-API'));

		});
	});

});