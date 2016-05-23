l = console.log
j = JSON.stringify
p = (item) -> l(j(item, null, 4))

breeze = require('breeze-client')
require('../src/breeze-json-api-uribuilder.js')
expect = require('chai').expect



describe "000.Init", ->	
	it "should not be null", -> expect(breeze).to.not.be.null		


describe "005. Basic query building", ->
	uriBuilder = undefined
	manager = undefined
	query = undefined
	buildUri = (query) -> uriBuilder.buildUri query, manager.metadataStore


	describe 'breeze.EntityQuery().from("persons")', ->
		before ->
			breeze.config.initializeAdapterInstances uriBuilder: 'json-api'
			ds = new (breeze.DataService)(
				serviceName: 'http://localhost:9000'
				hasServerMetadata: false)
			manager = new (breeze.EntityManager)(dataService: ds)
			uriBuilder = breeze.config.getAdapterInstance('uriBuilder', 'json-api')

		beforeEach -> query = (new (breeze.EntityQuery)).from('persons')
		
		describe 'where', ->
			it 'unset returns "persons"', -> expect(buildUri(query)).to.equal('persons') 
			it '"name == Scott" returns "persons?filter[name]=Scott"', -> expect(buildUri(query.where("name", "==", "Scott"))).to.equal('persons?filter[name]=Scott') 
			