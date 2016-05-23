l = console.log
j = JSON.stringify
p = (item) -> l(j(item, null, 4))

breeze = require('breeze-client')
require('../src/breeze-json-api-uribuilder.js')
expect = require('chai').expect


describe "000.Init", ->
	it "should not be null", -> 
		expect(breeze).to.not.be.null		

	uriBuilder = undefined
	manager = undefined

	executeQuery = (query) -> uriBuilder.buildUri query, manager.metadataStore

	before ->
		breeze.config.initializeAdapterInstances uriBuilder: 'json-api'
		ds = new (breeze.DataService)(
			serviceName: 'http://localhost:9000'
			hasServerMetadata: false)
		manager = new (breeze.EntityManager)(dataService: ds)
		uriBuilder = breeze.config.getAdapterInstance('uriBuilder', 'json-api')

	describe 'breeze.EntityQuery().from("persons")', ->
		it 'should return the URI for the persons endpoint', ->
			expectedURI = 'persons'
			query = (new (breeze.EntityQuery)).from('persons')
			expect(executeQuery(query), 'Get all Persons').equal(expectedURI) 
