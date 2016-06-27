var Q, breeze, buildUri, expect, fakeServer, j, l, manager, p, query, sinon, uriBuilder, jsdom;

l = console.log;

j = JSON.stringify;

p = function(item) {
    return l(j(item, null, 4));
};

Q = require('q');

breeze = require('breeze-client');

require('../src/breeze.labs.dataservice.abstractrest');

require('../src/breeze-json-api-uribuilder.js');

require('../src/breeze-json-api-adapter.js');

require('../src/breeze-requests-adapter.js');



sinon = require('sinon');

expect = require('chai').expect;

uriBuilder = void 0;

manager = void 0;

query = void 0;

fakeServer = void 0;

buildUri = function(query) {
    return uriBuilder.buildUri(query, manager.metadataStore);
};

before(function() {
    var ds;
    breeze.config.initializeAdapterInstances({
        uriBuilder: 'json-api'
    });
    breeze.config.initializeAdapterInstance('ajax', 'breeze-request-adapter', true);
    breeze.config.initializeAdapterInstances({
        dataService: 'json-api'
    });
    breeze.config.setQ(Q);
    ds = new breeze.DataService({
        serviceName: 'http://localhost:9000',
        hasServerMetadata: false
    });
    manager = new breeze.EntityManager({
        dataService: ds
    });
    return uriBuilder = breeze.config.getAdapterInstance('uriBuilder', 'json-api');
});

beforeEach(function() {
    return query = (new breeze.EntityQuery).from('people');
});

describe("000. Init", function() {
    return it("should not be null", function() {
        return expect(breeze).to.not.be["null"];
    });
});

describe("005. Basic query building", function() {
    return describe('breeze.EntityQuery().from("people")', function() {
        describe('where', function() {
            it('unset returns "people"', function() {
                return expect(buildUri(query)).to.equal('people');
            });
            it('"name == Scott" returns "people?filter[name]=Scott"', function() {
                return expect(decodeURIComponent(buildUri(query.where("name", "==", "Scott")))).to.equal('people?filter[name]=Scott');
            });
            it('"id == 55555" returns "people/55555"', function() {
                return expect(decodeURIComponent(buildUri(query.where("id", "==", "55555")))).to.equal('people/55555');
            });
            return it('"name in [Raynor,LiLi]" returns people?filter[name]=Raynor,LiLi', function() {
                return expect(decodeURIComponent(buildUri(query.where('name', 'in', ['Raynor', 'LiLi'])))).to.equal('people?filter[name]=Raynor,LiLi');
            });
        });
        return describe('unsupported operators', function() {
            it('"name startsWith A" to throw unsupported operator exception', function() {
                return expect(function() {
                    return buildUri(query.where('name', 'startsWith', 'A'));
                }).to["throw"]('startswith is currently not supported by JSON-API');
            });
            it('"name endsWith A" to throw unsupported operator exception', function() {
                return expect(function() {
                    return buildUri(query.where('name', 'endsWith', 'A'));
                }).to["throw"]('endswith is currently not supported by JSON-API');
            });
            it('"name contains A" to throw unsupported operator exception', function() {
                return expect(function() {
                    return buildUri(query.where('name', 'contains', 'A'));
                }).to["throw"]('contains is currently not supported by JSON-API');
            });
            it('"name ne Scott" to throw unsupported operator exception', function() {
                return expect(function() {
                    return buildUri(query.where('name', 'ne', 'Scott'));
                }).to["throw"]('ne is currently not supported by JSON-API');
            });
            it('"age gt 20" to throw unsupported operator exception', function() {
                return expect(function() {
                    return buildUri(query.where('age', 'gt', 20));
                }).to["throw"]('gt is currently not supported by JSON-API');
            });
            it('"age ge 20" to throw unsupported operator exception', function() {
                return expect(function() {
                    return buildUri(query.where('age', 'ge', 20));
                }).to["throw"]('ge is currently not supported by JSON-API');
            });
            it('"age lt 20" to throw unsupported operator exception', function() {
                return expect(function() {
                    return buildUri(query.where('age', 'lt', 20));
                }).to["throw"]('lt is currently not supported by JSON-API');
            });
            return it('"age le 20" to throw unsupported operator exception', function() {
                return expect(function() {
                    return buildUri(query.where('age', 'le', 20));
                }).to["throw"]('le is currently not supported by JSON-API');
            });
        });
    });
});

describe("010. Advanced query building", function() {
    return describe('Predicates', function() {
        var andOrPredicate, andPredicate, orPredicate;
        andPredicate = breeze.Predicate.create('firstName', '==', 'Scott').and('lastName', '==', 'Raynor');
        it("'firstName', '==', 'Scott' AND 'lastName', '==', 'Raynor' returns people?filter[firstName]=Scott&filter[lastName]=Raynor", function() {
            return expect(decodeURIComponent(buildUri(query.where(andPredicate)))).to.equal('people?filter[firstName]=Scott&filter[lastName]=Raynor');
        });
        orPredicate = breeze.Predicate.create('firstName', '==', 'Scott').or('lastName', '==', 'Raynor');
        it("'firstName', '==', 'Scott' OR 'lastName', '==', 'Raynor' to throw unsupported operator exception", function() {
            return expect(function() {
                return buildUri(query.where(orPredicate));
            }).to["throw"]('or is currently not supported by JSON-API');
        });
        andOrPredicate = breeze.Predicate.create('firstName', '==', 'Scott').and('lastName', '==', 'Raynor').or('age', '==', '25');
        return it("'firstName', '==', 'Scott' AND 'lastName', '==', 'Raynor' or 'age' == '25' to throw unsupported operator exception", function() {
            return expect(function() {
                return buildUri(query.where(orPredicate));
            }).to["throw"]('or is currently not supported by JSON-API');
        });
    });
});

describe('015. OrderBy', function() {
    describe('orderBy single', function() {
        it('"firstName" returns "people?sort=firstName"', function() {
            return expect(decodeURIComponent(buildUri(query.orderBy('firstName')))).to.equal('people?sort=firstName');
        });
        it('"firstName desc" returns "people?sort=-firstName"', function() {
            return expect(decodeURIComponent(buildUri(query.orderBy('firstName desc')))).to.equal('people?sort=-firstName');
        });
        it('"firstName desc", false" returns "people?sort=firstName"', function() {
            return expect(decodeURIComponent(buildUri(query.orderBy('firstName desc', false)))).to.equal('people?sort=firstName');
        });
        return it('"firstName, true" returns "people?sort=-firstName"', function() {
            return expect(decodeURIComponent(buildUri(query.orderBy('firstName', true)))).to.equal('people?sort=-firstName');
        });
    });
    return describe('orderBy multiple', function() {
        it('"firstName, lastName" returns "people?sort=firstName,lastName"', function() {
            return expect(decodeURIComponent(buildUri(query.orderBy('firstName, lastName')))).to.equal('people?sort=firstName,lastName');
        });
        it('"firstName desc, lastName" returns "people?sort=-firstName,lastName"', function() {
            return expect(decodeURIComponent(buildUri(query.orderBy('firstName desc, lastName')))).to.equal('people?sort=-firstName,lastName');
        });
        it('"firstName, lastName desc" returns "people?sort=firstName,-lastName"', function() {
            return expect(decodeURIComponent(buildUri(query.orderBy('firstName, lastName desc')))).to.equal('people?sort=firstName,-lastName');
        });
        it('"firstName desc, lastName desc" returns "people?sort=-firstName,-lastName"', function() {
            return expect(decodeURIComponent(buildUri(query.orderBy('firstName desc, lastName desc')))).to.equal('people?sort=-firstName,-lastName');
        });
        it('"firstName desc, lastName desc", false returns "people?sort=firstName,lastName"', function() {
            return expect(decodeURIComponent(buildUri(query.orderBy('firstName desc, lastName desc', false)))).to.equal('people?sort=firstName,lastName');
        });
        return it('"firstName, lastName", true returns "people?sort=-firstName,-lastName"', function() {
            return expect(decodeURIComponent(buildUri(query.orderBy('firstName, lastName', true)))).to.equal('people?sort=-firstName,-lastName');
        });
    });
});

describe.skip('020. NOT SURE HOW TO IMPLEMENT WITHOUT METADATA Select', function() {
    it('should return people?include=firstName when query.select("firstName")', function() {
        return expect(decodeURIComponent(buildUri(query.select('firstName')))).to.equal('people?fields[people]=firstName');
    });
    return it('should return people?include=firstName,lastName when query.select("firstName, lastName")', function() {
        return expect(decodeURIComponent(buildUri(query.select('firstName')))).to.equal('people?fields[people]=firstName,lastName');
    });
});

describe('030. Expand', function() {
    it('expand siblings', function() {
        return expect(decodeURIComponent(buildUri(query.expand('siblings')))).to.equal('people?include=siblings');
    });
    it('expand siblings, cousins', function() {
        return expect(decodeURIComponent(buildUri(query.expand('siblings,cousins')))).to.equal('people?include=siblings,cousins');
    });
    it('expand siblings.pets', function() {
        return expect(decodeURIComponent(buildUri(query.expand('siblings.pets')))).to.equal('people?include=siblings.pets');
    });
    return it('expand siblings.pets, cousins', function() {
        return expect(decodeURIComponent(buildUri(query.expand('siblings.pets, cousins')))).to.equal('people?include=siblings.pets,cousins');
    });
});

//
// before(function() {
//
//     fakeServer = sinon.fakeServer.create();
//     fakeServer.autoRespond;
//     return fakeServer.respondWith("GET", "/some/article/comments.json", [
//         200, {
//             "Content-Type": "application/json"
//         }, '[{ "id": 12, "comment": "Hey there" }]'
//     ]);
// });

describe('040. Execute Query', function() {

    return it.only('executeQuery', function() {
        return manager.executeQuery(query).then(function(data) {
            return console.log("lol");
        });
    });
});

// ---
// generated by coffee-script 1.9.2