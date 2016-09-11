require './helpers/helper.coffee'

l = console.log
j = JSON.stringify
p = (item) -> l(j(item, null, 4))

Q = require('q')

breeze = require('breeze-client')
require('../node_modules/breeze-client-labs/breeze.labs.dataservice.abstractrest')
require('../src/breeze-json-api-uribuilder.js')
require('../src/breeze-json-api-adapter.js')
require('../src/breeze-requests-adapter.js')
sinon = require('sinon')

expect = require('chai').expect

uriBuilder = undefined
manager = undefined
query = undefined
buildUri = (query) -> uriBuilder.buildUri query, manager.metadataStore

before ->
  breeze.config.initializeAdapterInstances uriBuilder: 'json-api'
  breeze.config.initializeAdapterInstances dataService: 'json-api'
  breeze.config.initializeAdapterInstance('ajax', 'breeze-request-adapter', true); 
  breeze.config.setQ(Q)
  ds = new (breeze.DataService)(
    serviceName: 'http://localhost:9000'
    hasServerMetadata: false)
  manager = new (breeze.EntityManager)(dataService: ds)
  uriBuilder = breeze.config.getAdapterInstance('uriBuilder', 'json-api')

beforeEach -> query = (new (breeze.EntityQuery)).from('people')

describe "000. Init", ->
  it "should not be null", -> expect(breeze).to.not.be.null

describe "005. Basic query building", ->

  describe 'breeze.EntityQuery().from("people")', ->

    describe 'where', ->
      it 'unset returns "people"', -> expect(buildUri(query)).to.equal('people')
      it '"name == Scott" returns "people?filter[name]=Scott"', -> expect(decodeURIComponent(buildUri(query.where("name", "==", "Scott")))).to.equal('people?filter[name]=Scott')
      it '"id == 55555" returns "people/55555"', -> expect(decodeURIComponent(buildUri(query.where("id", "==", "55555")))).to.equal('people/55555')
      it '"name in [Raynor,LiLi]" returns people?filter[name]=Raynor,LiLi', -> expect(decodeURIComponent(buildUri(query.where('name','in', ['Raynor','LiLi'])))).to.equal('people?filter[name]=Raynor,LiLi')

    describe 'unsupported operators', ->
      it '"name startsWith A" to throw unsupported operator exception', -> expect( -> buildUri(query.where('name','startsWith', 'A'))).to.throw('startswith is currently not supported by JSON-API')
      it '"name endsWith A" to throw unsupported operator exception', -> expect( -> buildUri(query.where('name','endsWith', 'A'))).to.throw('endswith is currently not supported by JSON-API')
      it '"name contains A" to throw unsupported operator exception', -> expect( -> buildUri(query.where('name','contains', 'A'))).to.throw('contains is currently not supported by JSON-API')
      it '"name ne Scott" to throw unsupported operator exception', -> expect( -> buildUri(query.where('name','ne', 'Scott'))).to.throw('ne is currently not supported by JSON-API')
      it '"age gt 20" to throw unsupported operator exception', -> expect( -> buildUri(query.where('age','gt', 20))).to.throw('gt is currently not supported by JSON-API')
      it '"age ge 20" to throw unsupported operator exception', -> expect( -> buildUri(query.where('age','ge', 20))).to.throw('ge is currently not supported by JSON-API')
      it '"age lt 20" to throw unsupported operator exception', -> expect( -> buildUri(query.where('age','lt', 20))).to.throw('lt is currently not supported by JSON-API')
      it '"age le 20" to throw unsupported operator exception', -> expect( -> buildUri(query.where('age','le', 20))).to.throw('le is currently not supported by JSON-API')

describe "010. Advanced query building", ->

    describe 'Predicates', ->

        andPredicate = breeze.Predicate.create('firstName', '==', 'Scott').and(   'lastName', '==', 'Raynor');
        it "'firstName', '==', 'Scott' AND 'lastName', '==', 'Raynor' returns people?filter[firstName]=Scott&filter[lastName]=Raynor", -> expect(decodeURIComponent(buildUri(query.where(andPredicate)))).to.equal('people?filter[firstName]=Scott&filter[lastName]=Raynor');

        orPredicate = breeze.Predicate.create('firstName', '==', 'Scott').or(   'lastName', '==', 'Raynor');
        it "'firstName', '==', 'Scott' OR 'lastName', '==', 'Raynor' to throw unsupported operator exception", -> expect( -> buildUri(query.where(orPredicate))).to.throw('or is currently not supported by JSON-API')

        andOrPredicate = breeze.Predicate.create('firstName', '==', 'Scott').and(   'lastName', '==', 'Raynor').or('age', '==', '25');
        it "'firstName', '==', 'Scott' AND 'lastName', '==', 'Raynor' or 'age' == '25' to throw unsupported operator exception", -> expect( -> buildUri(query.where(orPredicate))).to.throw('or is currently not supported by JSON-API')



describe '015. OrderBy', ->

    describe 'orderBy single', ->
        it '"firstName" returns "people?sort=firstName"', -> expect(decodeURIComponent(buildUri(query.orderBy('firstName')))).to.equal('people?sort=firstName')
        it '"firstName desc" returns "people?sort=-firstName"', -> expect(decodeURIComponent(buildUri(query.orderBy('firstName desc')))).to.equal('people?sort=-firstName')
        it '"firstName desc", false returns "people?sort=firstName"', -> expect(decodeURIComponent(buildUri(query.orderBy('firstName desc', false)))).to.equal('people?sort=firstName')
        it '"firstName, true" returns "people?sort=-firstName"', -> expect(decodeURIComponent(buildUri(query.orderBy('firstName', true)))).to.equal('people?sort=-firstName')

    describe 'orderBy multiple', ->
        it '"firstName, lastName" returns "people?sort=firstName,lastName"', -> expect(decodeURIComponent(buildUri(query.orderBy('firstName, lastName')))).to.equal('people?sort=firstName,lastName')
        it '"firstName desc, lastName" returns "people?sort=-firstName,lastName"', -> expect(decodeURIComponent(buildUri(query.orderBy('firstName desc, lastName')))).to.equal('people?sort=-firstName,lastName')
        it '"firstName, lastName desc" returns "people?sort=firstName,-lastName"', -> expect(decodeURIComponent(buildUri(query.orderBy('firstName, lastName desc')))).to.equal('people?sort=firstName,-lastName')
        it '"firstName desc, lastName desc" returns "people?sort=-firstName,-lastName"', -> expect(decodeURIComponent(buildUri(query.orderBy('firstName desc, lastName desc')))).to.equal('people?sort=-firstName,-lastName')
        it '"firstName desc, lastName desc", false returns "people?sort=firstName,lastName"', -> expect(decodeURIComponent(buildUri(query.orderBy('firstName desc, lastName desc', false)))).to.equal('people?sort=firstName,lastName')
        it '"firstName, lastName", true returns "people?sort=-firstName,-lastName"', -> expect(decodeURIComponent(buildUri(query.orderBy('firstName, lastName', true)))).to.equal('people?sort=-firstName,-lastName')

describe.only '020. Select', ->
    it 'should return fields[people]=firstName when query.select("firstName")', -> expect(decodeURIComponent(buildUri(query.select('firstName')))).to.equal('people?fields[people]=firstName')
    it 'should return fields[people]=firstName,lastName when query.select("firstName, lastName")', -> expect(decodeURIComponent(buildUri(query.select('firstName')))).to.equal('people?fields[people]=firstName,lastName')

describe '030. Expand', ->
    it 'expand siblings', -> expect(decodeURIComponent(buildUri(query.expand('siblings')))).to.equal('people?include=siblings')
    it 'expand siblings, cousins', -> expect(decodeURIComponent(buildUri(query.expand('siblings,cousins')))).to.equal('people?include=siblings,cousins')
    it 'expand siblings.pets', -> expect(decodeURIComponent(buildUri(query.expand('siblings.pets')))).to.equal('people?include=siblings.pets')
    it 'expand siblings.pets, cousins', -> expect(decodeURIComponent(buildUri(query.expand('siblings.pets, cousins')))).to.equal('people?include=siblings.pets,cousins')


before (done) ->
    post 'covet/routes',
      verb: 'get'
      path: '/people'
      response:
        json:
           id: 3
           name: "Frank"
           age: 12
      , (body, res) ->
      done()


 
describe '040. Execute Query', ->
    it 'executeQuery', ->
        manager.executeQuery(query).then((data) ->
            console.log("lol")
    )
