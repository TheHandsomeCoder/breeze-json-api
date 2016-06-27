(function (factory) {
  // Module systems magic dance.
  if (typeof breeze === "object") {
    factory(breeze);
  } else if (typeof require === "function" && typeof exports === "object" && typeof module === "object") {
    // CommonJS or Node: hard-coded dependency on "breeze"
    factory(require("breeze-client"));
  } else if (typeof define === "function" && define["amd"]) {
    // AMD anonymous module with hard-coded dependency on "breeze"
    define(["breeze"], factory);
  }
}(function (breeze) {
  "use strict";
  var core = breeze.core;

  var rq;

  var ctor = function AjaxJQueryAdapter() {
    this.name = "breeze-request-adapter";
    this.defaultSettings = { };
    this.requestInterceptor = null;
  };

  var proto = ctor.prototype;

  proto.initialize = function () {
    rq = require('request-promise');
  };

  proto.ajax = function (config) {
    if (!rq) {
      throw new Error("Unable to locate requests-promise");
    }

    var options = {
      uri: config.url,
      method: config.type,
      headers: config.headers || {},
      body: config.params || config.data,
      json: true // Automatically parses the JSON string in the response
    };

    rq(options)
      .then(successFn)
      .catch(errorFn);

    function successFn(response) {
      var httpResponse = {
        config: config,
        data: data,
        getHeaders: getHeadersFn(jqXHR),
        status: jqXHR.status,
        statusText: statusText
      };
      config.success(httpResponse);
    }

    function errorFn(error) {
      var httpResponse = {
        config: config,
        data: jqXHR.responseText,
        error: errorThrown,
        getHeaders: getHeadersFn(jqXHR),
        status: jqXHR.status,
        statusText: statusText
      };
      config.error(httpResponse);
    }
  };

  function getHeadersFn(jqXHR) {
    if (jqXHR.status === 0) { // timeout or abort; no headers
      return function (headerName) {
        return (headerName && headerName.length > 0) ? "" : {};
      };
    } else { // jqXHR should have header functions
      return function (headerName) {
        return (headerName && headerName.length > 0) ?
               jqXHR.getResponseHeader(headerName) :
               jqXHR.getAllResponseHeaders();
      };
    }
  }

  breeze.config.registerAdapter("ajax", ctor);

}));