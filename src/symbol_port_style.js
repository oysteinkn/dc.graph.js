dc_graph.symbol_port_style = function() {
    var _style = {};
    var _nodePorts, _node;
    var _d3tip = d3.tip()
            .attr('class', 'd3-tip')
            .html(function(d) { return "<span>" + d + "</span>"; })
            .direction('w');

    _style.symbolScale = property(d3.shuffle(d3.scale.ordinal().range(d3.svg.symbolTypes)));
    _style.colorScale = property(d3.scale.ordinal().range(
         // colorbrewer light qualitative scale
        d3.shuffle(['#8dd3c7','#ffffb3','#bebada','#fb8072','#80b1d3','#fdb462',
                    '#b3de69','#fccde5','#d9d9d9','#bc80bd','#ccebc5','#ffed6f'])));

    function name_or_edge(p) {
        return p.named ? p.name : _style.parent().edgeKey.eval(p.edges[0]);
    }
    _style.portSymbol = property(name_or_edge);
    _style.portColor = property(name_or_edge);
    _style.portRadius = property(d3.functor(7));
    _style.portHoverNodeRadius = property(d3.functor(10));
    _style.portHoverPortRadius = property(d3.functor(14));
    _style.portDisplacement = property(d3.functor(2));
    _style.portBackground = property(d3.functor(true));
    _style.portPadding = property(d3.functor(2));
    _style.portLabel = _style.portText = property(function(p) {
        return p.name;
    });
    _style.portLabelPadding = property({x: 5, y: 5});

    function port_fill(d) {
        return _style.colorScale()(_style.portColor()(d));
    }
    function port_transform(d) {
        var l = Math.hypot(d.pos.x, d.pos.y),
            u = {x: d.pos.x / l, y: d.pos.y / l},
            disp = _style.portDisplacement()(d),
            pos = {x: d.pos.x + disp * u.x, y: d.pos.y + disp * u.y};
        return 'translate(' + pos.x + ',' + pos.y + ')';
    }
    function port_symbol(d, size) {
        return d3.svg.symbol()
            .type(_style.symbolScale()(_style.portSymbol()(d))) // why no eval here (does that system make sense?)
            .size(size*size)
        ();
    }
    function is_left(p) {
        return p.vec[0] < 0;
    }
    function hover_radius(d) {
        switch(d.state) {
        case 'large':
            return _style.portHoverPortRadius()(d);
        case 'medium':
            return _style.portHoverNodeRadius()(d);
        case 'small':
        default:
            return _style.portRadius()(d);
        }
    }
    // yuk but correct, fill the port the same way node <g> is
    function node_fill() {
        var scale = _style.parent().nodeFillScale() || identity;
        return scale(_style.parent().nodeFill.eval(d3.select(this.parentNode.parentNode).datum()));
    }
    _style.animateNodes = function(nids, before) {
        var setn = d3.set(nids);
        var node = _node
                .filter(function(d) {
                    return setn.has(_style.parent().nodeKey.eval(d));
                });
        var symbol = node.selectAll('g.port');
        var shimmer = symbol.filter(function(p) { return p.state === 'shimmer'; }),
            nonshimmer = symbol.filter(function(p) { return p.state !== 'shimmer'; });
        if(shimmer.size()) {
            if(before)
                before.each('end', repeat);
            else repeat();
        }

        function repeat() {
            var shimin = shimmer.transition()
                    .duration(1000)
                    .ease("bounce");
            shimin.selectAll('circle.port')
                .attr('r', function(d) {
                    return _style.portHoverPortRadius()(d) + _style.portPadding()(d);
                });
            shimin.selectAll('path.port')
                .attr({
                    d: function(d) {
                        return port_symbol(d, _style.portHoverPortRadius()(d));
                    }
                });
            var shimout = shimin.transition()
                    .duration(1000)
                    .ease('sin');
            shimout.selectAll('circle.port')
                .attr('r', function(d) {
                    return _style.portRadius()(d) + _style.portPadding()(d);
                });
            shimout.selectAll('path.port')
                .attr({
                    d: function(d) {
                        return port_symbol(d, _style.portRadius()(d));
                    }
                });
            shimout.each("end", repeat);
        }

        var trans = nonshimmer.transition()
                .duration(250);
        trans.selectAll('circle.port')
            .attr({
                r: function(d) {
                    return hover_radius(d) + _style.portPadding()(d);
                }
            });
        trans.selectAll('path.port')
            .attr({
                d: function(d) {
                    return port_symbol(d, hover_radius(d));
                }
            });

        function text_showing(d) {
            return d.state === 'large' || d.state === 'medium';
        }
        trans.selectAll('text.port')
            .attr({
                opacity: function(d) {
                    return text_showing(d) ? 1 : 0;
                },
                'pointer-events': function(d) {
                    return text_showing(d) ? 'auto' : 'none';
                }
            });
        trans.selectAll('rect.port')
            .attr('opacity', function(p) {
                return text_showing(p) ? 1 : 0;
            });
        // bring all nodes which have labels showing to the front
        _node.filter(function(n) {
            return _nodePorts[_style.parent().nodeKey.eval(n)].some(text_showing);
        }).each(function(){
            this.parentNode.appendChild(this);
        });

        return trans;
    };
    _style.eventPort = function() {
        var parent = d3.select(d3.event.target.parentNode);
        if(d3.event.target.parentNode.tagName === 'g' && parent.classed('port'))
            return parent.datum();
        return null;
    };
    _style.drawPorts = function(nodePorts, node) {
        _nodePorts = nodePorts; _node = node;
        var port = node.selectAll('g.port').data(function(n) {
            return nodePorts[_style.parent().nodeKey.eval(n)] || [];
        }, name_or_edge);
        port.exit().remove();
        var portEnter = port.enter().append('g')
            .attr({
                class: 'port',
                transform: port_transform
            });
        port.transition('port-position')
            .duration(_style.parent().stagedDuration())
            .delay(_style.parent().stagedDelay(false)) // need to account for enters as well
            .attr({
                transform: port_transform
            });

        var background = port.selectAll('circle.port').data(function(p) {
            return _style.portBackground()(p) ? [p] : [];
        });
        background.exit().remove();
        background.enter().append('circle')
            .attr({
                class: 'port',
                r: function(d) {
                    return _style.portRadius()(d) + _style.portPadding()(d);
                },
                fill: node_fill,
                nodeStrokeWidth: 0
            });
        background.transition()
            .duration(_style.parent().stagedDuration())
            .delay(_style.parent().stagedDelay(false)) // need to account for enters as well
            .attr({
                r: function(d) {
                    return _style.portRadius()(d) + _style.portPadding()(d);
                },
                fill: node_fill
            });

        var symbolEnter = portEnter.append('path')
                .attr({
                    class: 'port',
                    fill: port_fill,
                    d: function(d) {
                        return port_symbol(d,  _style.portRadius()(d));
                    }
                });
        var symbol = port.select('path.port');
        symbol.transition()
            .duration(_style.parent().stagedDuration())
            .delay(_style.parent().stagedDelay(false)) // need to account for enters as well
            .attr({
                fill: port_fill,
                d: function(d) {
                    return port_symbol(d, _style.portRadius()(d));
                }
            });

        var label = port.selectAll('text.port').data(function(p) {
            return _style.portText.eval(p) ? [p] : [];
        });
        label.exit().remove();
        var labelEnter = label.enter();
        labelEnter.append('rect')
            .attr({
                class: 'port',
                'pointer-events': 'none'
            });
        labelEnter.append('text')
            .attr({
                class: 'port',
                'alignment-baseline': 'middle',
                'pointer-events': 'none',
                cursor: 'default',
                opacity: 0
            });
        label
            .each(function(p) {
                p.offset = (is_left(p) ? -1 : 1) * (_style.portHoverPortRadius()(p) + _style.portPadding()(p));
            })
            .attr({
                'text-anchor': function(d) {
                    return is_left(d) ? 'end' : 'start';
                },
                transform: function(p) {
                    return 'translate(' + p.offset + ',0)';
                }
            })
            .text(_style.portText.eval)
            .each(function(p) {
                p.bbox = this.getBBox();
            });
        port.selectAll('rect.port')
            .attr({
                x: function(p) {
                    return (p.offset < 0 ? p.offset - p.bbox.width : p.offset) - _style.portLabelPadding.eval(p).x;
                },
                y: function(p) {
                    return -p.bbox.height/2 - _style.portLabelPadding.eval(p).y;
                },
                width: function(p) {
                    return p.bbox.width + 2*_style.portLabelPadding.eval(p).x;
                },
                height: function(p) {
                    return p.bbox.height + 2*_style.portLabelPadding.eval(p).y;
                },
                fill: 'white',
                opacity: 0
            });
        _style.enableHover(true);
        return _style;
    };

    _style.enableHover = function(whether) {
        if(whether) {
            _node.on('mouseover.grow-ports', function(d) {
                var nid = _style.parent().nodeKey.eval(d);
                var activePort = _style.eventPort();
                _nodePorts[nid].forEach(function(p) {
                    p.state = p === activePort ? 'large' : activePort ? 'small' : 'medium';
                });
                _style.animateNodes([nid]);
            });
            _node.on('mouseout.grow-ports', function(d) {
                var nid = _style.parent().nodeKey.eval(d);
                _nodePorts[nid].forEach(function(p) {
                    p.state = 'small';
                });
                _style.animateNodes([nid]);
            });
        } else {
            _node.on('mouseover.grow-ports', null);
            _node.on('mouseout.grow-ports', null);
        }
        return _style;
    };

    _style.showTip = function(port) {
        _node
            .filter(function(d) {
                return port.node === d;
            })
            .call(_d3tip.show);
        return _style;
    };

    _style.parent = property(null);
    return _style;
};