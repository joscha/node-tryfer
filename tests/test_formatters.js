var util = require('util');

var _ = require("underscore");

var formatters = require('..').formatters;
var trace = require('..').trace;
var zipkinCore_types = require('../lib/_thrift/zipkinCore/zipkinCore_types');

module.exports = {
  restkinFormatterTests: {
    test_basic_trace_and_annotations: function(test){
      var t, a, expected;
      t = new trace.Trace('test', {spanId: 1, traceId:5});
      a = [new trace.Annotation('name1', 1, 'test'),
           new trace.Annotation('name2', 2, 'test')];
      expected = {
        trace_id: '5',
        span_id: '1',
        name: 'test',
        annotations: [
          {
            key: 'name1',
            value: 1,
            type: 'test'
          },
          {
            key: 'name2',
            value: 2,
            type: 'test'
          }
        ]
      };
      formatters.formatForRestkin(t, a, function(error, value) {
        test.equal(error, null);
        test.deepEqual(JSON.parse(value), expected);
        test.done();
      });
    },
    test_trace_with_parentSpanId: function(test){
      var t, a, expected;
      t = new trace.Trace('test', {parentSpanId:1, spanId: 2, traceId:5});
      a = [];
      expected = {
        trace_id: '5',
        parent_span_id: '1',
        span_id: '2',
        name: 'test',
        annotations: []
      };
      formatters.formatForRestkin(t, a, function(error, value) {
        test.equal(error, null);
        test.deepEqual(JSON.parse(value), expected);
        test.done();
      });
    },
    test_trace_with_annotation_with_endpoint: function(test) {
      var t, a, expected;
      t = new trace.Trace('test', {spanId: 1, traceId:5});
      a = [new trace.Annotation('name1', 1, 'test',
                                new trace.Endpoint('1.1.1.1', 5, 'service'))];
      expected = {
        trace_id: '5',
        span_id: '1',
        name: 'test',
        annotations: [
          {
            key: 'name1',
            value: 1,
            type: 'test',
            host: {
              ipv4: '1.1.1.1',
              port: 5,
              service_name: 'service'
            }
          }
        ]
      };
      formatters.formatForRestkin(t, a, function(error, value) {
        test.equal(error, null);
        test.deepEqual(JSON.parse(value), expected);
        test.done();
      });
    }
  },
  zipkinFormatterTests: {
    test_basic_trace_and_annotations: function(test){
      var t, a, expected;
      t = new trace.Trace('span', {spanId: 1, traceId:1, parentSpanId:0});
      a = [new trace.Annotation('name1', 1, 'test'),
           new trace.Annotation('name2', 2, 'test')];
      expected = {
        trace_id: '5',
        span_id: '1',
        name: 'test',
        annotations: [
          {
            key: 'name1',
            value: 1,
            type: 'test'
          },
          {
            key: 'name2',
            value: 2,
            type: 'test'
          }
        ]
      };
      formatters.formatForZipkin(t, a, function(error, value) {
        var b = new Buffer(value, "base64");
        var tprotocol = require('../node_modules/thrift/lib/thrift/protocol');
        var ttransport = require('../node_modules/thrift/lib/thrift/transport');
        var trans_receiver = ttransport.TBufferedTransport.receiver(function(trans) {
          var prot = new tprotocol.TBinaryProtocol(trans);
          var span = new zipkinCore_types.Span();
          span.read(prot);
          test.deepEqual([span.id, span.trace_id, span.name], [1, 1, 'span']);
          test.done();
        });
        trans_receiver(b);
      });
    }
  }
};