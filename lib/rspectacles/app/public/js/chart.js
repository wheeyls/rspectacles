// @format
/*global define: true d3: true */
define(['jquery', 'pathtree', 'details'], function(
  $,
  PathTree,
  details,
) {
  'use strict';

  function chart(options) {
    var svg,
      partition,
      arc,
      me,
      tmpl = $('#template').html(),
      render;

    options = $.extend(
      {
        width: 960,
        height: 700,
        color: d3.scale.category20c(),
        isCount: false,
      },
      options,
    );

    options.radius = Math.min(options.width, options.height) / 2;

    svg = d3
      .select('body')
      .append('svg')
      .attr('width', options.width)
      .attr('height', options.height)
      .append('g')
      .attr(
        'transform',
        'translate(' + options.width / 2 + ',' + options.height * 0.52 + ')',
      );

    partition = d3.layout
      .partition()
      .sort(null)
      .size([2 * Math.PI, options.radius * options.radius]);

    arc = d3.svg
      .arc()
      .startAngle(function(d) {
        return d.x;
      })
      .endAngle(function(d) {
        return d.x + d.dx;
      })
      .innerRadius(function(d) {
        return Math.sqrt(d.y);
      })
      .outerRadius(function(d) {
        return Math.sqrt(d.y + d.dy);
      });

    // Stash the old values for transition.
    function stash(d) {
      d.x0 = d.x;
      d.dx0 = d.dx;
    }

    // Interpolate the arcs in data space.
    function arcTween(a) {
      var i = d3.interpolate({x: a.x0, dx: a.dx0}, a);
      return function tweener(t) {
        var b = i(t);
        a.x0 = b.x;
        a.dx0 = b.dx;
        return arc(b);
      };
    }

    function secToMin(time) {
      var pad = function(val) {
          return ('00' + val).slice(-2);
        },
        min = parseInt(time / 60),
        sec = parseInt(time % 60);

      return pad(min) + ':' + pad(sec);
    }

    function getValue() {
      return options.isCount
        ? function() {
            return 1;
          }
        : function(d) {
            return d.size;
          };
    }

    function getColor(d) {
      if (d.status && d.status === 'failed') {
        return '#f00';
      } else {
        return options.color(((d.children ? d : d.parent) || {}).name);
      }
    }

    function onUpdate(path) {
      path
        .attr('d', arc)
        .each(stash)
        .style('fill', getColor)
        .call(details.update);
    }

    function onEnter(path) {
      path
        .enter()
        .append('path')
        .attr('display', function(d) {
          return d.depth ? null : 'none';
        })
        .attr('d', arc)
        .style('stroke', function(d) {
          return 'rgba(255,255,255,0.3)';
        })
        .style('fill', getColor)
        .style('fill-rule', 'evenodd')
        .each(stash)
        .on('mouseover', details.update)
        .call(details.update);
    }

    function onExit(path) {
      path.exit().remove();
    }

    function onFormChange(path) {
      d3.selectAll('input').on('change', function change() {
        options.isCount = this.value === 'count';

        path
          .data(partition.value(getValue()).nodes)
          .transition()
          .duration(1500)
          .attrTween('d', arcTween);
      });
    }

    render = function() {
      var path = svg
        .datum(me.tree.nodes)
        .selectAll('path')
        .data(partition.value(getValue()).nodes);

      onUpdate(path);
      onEnter(path);
      onExit(path);
      onFormChange(path);

      render = function() {
        path.datum(me.tree.nodes).data(partition.value(getValue()).nodes);
      };
    };

    return (me = {
      tree: new PathTree(),

      render: render,

      reset: function() {
        me.tree = new PathTree();
        me.render();
      },

      push: function(data) {
        me.tree.add(data);
        me.render();
      },
    });
  }

  return chart;
});
