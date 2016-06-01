(function(factory) {
    if (typeof breeze === "object") {
        factory(breeze);
    } else if (typeof require === "function" && typeof exports === "object" && typeof module === "object") {
        // CommonJS or Node: hard-coded dependency on "breeze"
        factory(require("breeze-client"));
    } else if (typeof define === "function" && define["amd"]) {
        // AMD anonymous module with hard-coded dependency on "breeze"
        define(["breeze"], factory);
    }
}(function(breeze) {
    "use strict";
    var EntityType = breeze.EntityType;
    var toODataFragmentVisitor;

    var ctor = function UriBuilderJSONAPIAdapter() {
        this.name = "json-api";
    };
    var proto = ctor.prototype;

    proto.initialize = function() {};

    proto.buildUri = function(entityQuery, metadataStore) {
        // force entityType validation;
        var entityType = entityQuery._getFromEntityType(metadataStore, false);
        if (!entityType) {
            // anonymous type but still has naming convention info avail
            entityType = new EntityType(metadataStore);
        }

        var queryOptions = {};
        var entitiyID = getEntityIDFromWhereFragment(entityQuery.wherePredicate);
        queryOptions["filter"] = toWhereODataFragment(entityQuery.wherePredicate);
        queryOptions["sort"] = toOrderFragment(entityQuery.orderByClause);

        if (entityQuery.skipCount) {
            queryOptions["$skip"] = entityQuery.skipCount;
        }

        if (entityQuery.takeCount != null) {
            queryOptions["$top"] = entityQuery.takeCount;
        }

        queryOptions["include"] = toExpandODataFragment(entityQuery.expandClause);
        queryOptions["$select"] = toSelectODataFragment(entityQuery.selectClause);

        if (entityQuery.inlineCountEnabled) {
            queryOptions["$inlinecount"] = "allpages";
        }

        var qoText = toQueryOptionsString(queryOptions);
        return entityQuery.resourceName + ((entitiyID) ? '/' + entitiyID : '') + qoText

        // private methods to this func.
        function getEntityIDFromWhereFragment(wherePredicate) {
            if (!wherePredicate || wherePredicate.preds) return undefined;
            // validation occurs inside of the toODataFragment call here.
            if (wherePredicate.expr1Source.toUpperCase() === 'ID') {
                return wherePredicate.expr2Source
            } else {
                return undefined;
            }
        }

        function toWhereODataFragment(wherePredicate) {
            if (!wherePredicate) return undefined;
            // validation occurs inside of the toODataFragment call here.
            return wherePredicate.visit({
                entityType: entityType
            }, toODataFragmentVisitor);
        }

        function toOrderFragment(orderByClause) {
            if (!orderByClause) return undefined;
            orderByClause.validate(entityType);
            var strings = orderByClause.items.map(function(item) {
                return (item.isDesc ? "-" : "") + entityType.clientPropertyPathToServer(item.propertyPath, "/");
            });
            // should return something like CompanyName,Address/City desc
            return strings.join(',');
        }

        function toSelectODataFragment(selectClause) {
            if (!selectClause) return undefined;
            selectClause.validate(entityType);
            var frag = selectClause.propertyPaths.map(function(pp) {
                return entityType.clientPropertyPathToServer(pp, "/");
            }).join(",");
            return frag;
        }

        function toExpandODataFragment(expandClause) {
            if (!expandClause) return undefined;
            // no validate on expand clauses currently.
            // expandClause.validate(entityType);
            var frag = expandClause.propertyPaths.map(function(pp) {
                return entityType.clientPropertyPathToServer(pp, ".");
            }).join(",");
            return frag;
        }

        function toQueryOptionsString(queryOptions) {
            var qoStrings = [];
            for (var qoName in queryOptions) {
                var qoValue = queryOptions[qoName];
                if (qoValue !== undefined) {
                    if (qoName === 'filter') {
                        qoStrings.push(encodeURI(qoValue));
                    } else if (qoValue instanceof Array) {
                        qoValue.forEach(function(qov) {
                            qoStrings.push(qoName + "=" + encodeURIComponent(qov));
                        });
                    } else {
                        qoStrings.push(qoName + "=" + encodeURIComponent(qoValue));
                    }
                }
            }

            if (qoStrings.length > 0) {
                return "?" + qoStrings.join("&");
            } else {
                return "";
            }
        }
    };

    breeze.Predicate.prototype.toODataFragment = function(context) {
        return this.visit(context, toODataFragmentVisitor);
    };

    toODataFragmentVisitor = (function() {
        var visitor = {

            passthruPredicate: function() {
                return this.value;
            },

            unaryPredicate: function(context) {
                var predVal = this.pred.visit(context);
                return operatorFrom(this) + " " + "(" + predVal + ")";
            },

            binaryPredicate: function(context) {
                var expr1Val = this.expr1.visit(context);
                var expr2Val = this.expr2.visit(context);
                var prefix = context.prefix;
                if (prefix) {
                    expr1Val = prefix + "/" + expr1Val;
                }

                var operator = operatorFrom(this);
                if (expr1Val.toUpperCase() === 'ID') return;
                if (this.op.key === 'in') {
                    var result = expr2Val.map(function(v) {
                        return v;
                    }).join(",");
                    return `filter[${expr1Val}]=${result}`;
                } else if (this.op.isFunction) {
                    if (operator === "substringof") {
                        return operator + "(" + expr2Val + "," + expr1Val + ") eq true";
                    } else {
                        return operator + "(" + expr1Val + "," + expr2Val + ") eq true";
                    }
                } else {

                    return `filter[${expr1Val}]${operator}${expr2Val}`;
                    //return expr1Val + " " + odataOp + " " + expr2Val;
                }
            },

            andOrPredicate: function(context) {
                var result = this.preds.map(function(pred) {
                    var predVal = pred.visit(context);
                    return predVal;
                }).join(operatorFrom(this));
                return result;
            },

            anyAllPredicate: function(context) {
                var exprVal = this.expr.visit(context);
                var prefix = context.prefix;
                if (prefix) {
                    exprVal = prefix + "/" + exprVal;
                    prefix = "x" + (parseInt(prefix.substring(1)) + 1);
                } else {
                    prefix = "x1";
                }
                // need to create a new context because of 'prefix'
                var newContext = breeze.core.extend({}, context);
                newContext.entityType = this.expr.dataType;
                newContext.prefix = prefix;
                var newPredVal = this.pred.visit(newContext);
                return exprVal + "/" + operatorFrom(this) + "(" + prefix + ": " + newPredVal + ")";
            },

            litExpr: function() {
                if (Array.isArray(this.value)) {
                    return this.value.map(function(v) {
                        return v
                    }, this);
                } else {
                    return this.value;
                }
            },

            propExpr: function(context) {
                var entityType = context.entityType;
                // '/' is the OData path delimiter
                return entityType ? entityType.clientPropertyPathToServer(this.propertyPath, "/") : this.propertyPath;
            },

            fnExpr: function(context) {
                var exprVals = this.exprs.map(function(expr) {
                    return expr.visit(context);
                });
                return this.fnName + "(" + exprVals.join(",") + ")";
            }
        };

        var _operatorMap = {
           // 'contains': 'substringof',
            'eq': '=',
            'and': '&',
            'in': 'in'
        };

        function operatorFrom(node) {
            var op = _operatorMap[node.op.key];
            if (!op) {
                throw new Error(`${node.op.key} is currently not supported by JSON-API`);
            }

            return op
        }

        return visitor;
    }());

    breeze.config.registerAdapter("uriBuilder", ctor);

}));