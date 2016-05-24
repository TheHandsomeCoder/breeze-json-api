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


	describe 'breeze.EntityQuery().from("people")', ->
		before ->
			breeze.config.initializeAdapterInstances uriBuilder: 'json-api'
			ds = new (breeze.DataService)(
				serviceName: 'http://localhost:9000'
				hasServerMetadata: false)
			manager = new (breeze.EntityManager)(dataService: ds)
			uriBuilder = breeze.config.getAdapterInstance('uriBuilder', 'json-api')

		beforeEach -> query = (new (breeze.EntityQuery)).from('people')
		
		describe 'where', ->
			it 'unset returns "people"', -> expect(buildUri(query)).to.equal('people') 
			it '"name == Scott" returns "people?filter[name]=Scott"', -> expect(buildUri(query.where("name", "==", "Scott"))).to.equal('people?filter[name]=Scott') 
			it '"id == 55555" returns "people/55555"', -> expect(buildUri(query.where("id", "==", "55555"))).to.equal('people/55555')
			it '"name startsWith A" to throw unsupperted operator exception', -> expect(buildUri(query.where('name','startsWith', 'A'))).to.throw(Error('an error'))
			it '"name in [Raynor,LiLi]" returns people?filter[name]=Raynor,LiLi', -> expect(buildUri(query.where('name','in', ['Raynor','LiLi']))).to.equal('people?filter[name]=Raynor,LiLi')

		describe 'orderBy single', ->
			it '"firstName" returns "people?sort=firstName"', -> expect(buildUri(query.orderBy('firstName'))).to.equal('people?sort=firstName')
			it '"firstName desc" returns "people?sort=-firstName"', -> expect(buildUri(query.orderBy('firstName desc'))).to.equal('people?sort=-firstName')
			it '"firstName desc", false" returns "people?sort=firstName"', -> expect(buildUri(query.orderBy('firstName desc', false))).to.equal('people?sort=firstName')
			it '"firstName, true" returns "people?sort=-firstName"', -> expect(buildUri(query.orderBy('firstName'))).to.equal('people?sort=-firstName')
		
		describe 'orderBy multiple', ->
			it '"firstName, lastName" returns "people?sort=firstName,lastName"', -> expect(buildUri(query.orderBy('firstName, lastName'))).to.equal('people?sort=firstName,lastName')
			it '"firstName desc, lastName" returns "people?sort=-firstName,lastName"', -> expect(buildUri(query.orderBy('firstName desc, lastName'))).to.equal('people?sort=-firstName,lastName')
			it '"firstName , lastName desc" returns "people?sort=firstName,-lastName"', -> expect(buildUri(query.orderBy('firstName, lastName'))).to.equal('people?sort=firstName,-lastName')
			it '"firstName desc, lastName desc" returns "people?sort=-firstName,-lastName"', -> expect(buildUri(query.orderBy('firstName desc, lastName desc'))).to.equal('people?sort=-firstName,-lastName')
			it '"firstName desc, lastName desc", false returns "people?sort=firstName,lastName"', -> expect(buildUri(query.orderBy('firstName desc, lastName desc', false))).to.equal('people?sort=firstName,lastName')
			it '"firstName, lastName", true returns "people?sort=-firstName,-lastName"', -> expect(buildUri(query.orderBy('firstName, lastName', true))).to.equal('people?sort=-firstName,-lastName')





