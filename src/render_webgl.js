dc_graph.render_webgl = function() {
    //var _svg = null, _defs = null, _g = null, _nodeLayer = null, _edgeLayer = null;
    var _camera, _scene, _webgl_renderer;
    var _controls;
    var _nodeMaterial, _edgeMaterial;
    var _animating = false; // do not refresh during animations
    var _renderer = {};

    _renderer.rendererType = function() {
        return 'webgl';
    };

    _renderer.parent = property(null);

    _renderer.isRendered = function() {
        return !!_camera;
    };

    _renderer.initializeDrawing = function () {
        _camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
        _camera.position.z = 1000;

        _scene = new THREE.Scene();

        _nodeMaterial =  new THREE.ShaderMaterial({
            uniforms: {
                color: { value: new THREE.Color('888888') }
            },
            vertexShader: document.getElementById( 'vertexshader' ).textContent,
            fragmentShader: document.getElementById( 'fragmentshader' ).textContent
        });
        _edgeMaterial = new THREE.LineBasicMaterial( { color: 0xffffff, opacity: 1 } );

        _webgl_renderer = new THREE.WebGLRenderer({ antialias: true });
        _webgl_renderer.setPixelRatio(window.devicePixelRatio);
        _webgl_renderer.setSize(window.innerWidth, window.innerHeight);
        _renderer.parent().root().node().appendChild(_webgl_renderer.domElement);

        _controls = new THREE.OrbitControls(_camera, _webgl_renderer.domElement);
        _controls.minDistance = 250;
        _controls.maxDistance = 2000;
        return _renderer;
    };

    _renderer.resize = function(w, h) {
        return _renderer;
    };

    _renderer.rezoom = function(oldWidth, oldHeight, newWidth, newHeight) {
        return _renderer;
    };

    _renderer.globalTransform = function(pos, scale, animate) {
        return _renderer;
    };

    _renderer.translate = function(_) {
        if(!arguments.length)
            return [0,0];
        return _renderer;
    };

    _renderer.scale = function(_) {
        if(!arguments.length)
            return 1;
        return _renderer;
    };

    // argh
    _renderer.commitTranslateScale = function() {
    };

    _renderer.startRedraw = function(dispatch, wnodes, wedges) {
        wnodes.forEach(infer_shape(_renderer.parent()));
        return {wnodes: wnodes, wedges: wedges};
    };

    _renderer.draw = function(drawState, animatePositions) {
        drawState.wedges.forEach(function(e) {
            if(!e.pos.old)
                _renderer.parent().calcEdgePath(e, 'old', e.source.prevX || e.source.cola.x, e.source.prevY || e.source.cola.y,
                                                e.target.prevX || e.target.cola.x, e.target.prevY || e.target.cola.y);
            if(!e.pos.new)
                _renderer.parent().calcEdgePath(e, 'new', e.source.cola.x, e.source.cola.y, e.target.cola.x, e.target.cola.y);
        });
        return _renderer;
    };

    _renderer.drawPorts = function(drawState) {
        var nodePorts = _renderer.parent().nodePorts();
        if(!nodePorts)
            return;
        _renderer.parent().portStyle.enum().forEach(function(style) {
            var nodePorts2 = {};
            for(var nid in nodePorts)
                nodePorts2[nid] = nodePorts[nid].filter(function(p) {
                    return _renderer.parent().portStyleName.eval(p) === style;
                });
            // not implemented
            var port = _renderer.selectNodePortsOfStyle(drawState.node, style);
            //_renderer.parent().portStyle(style).drawPorts(port, nodePorts2, drawState.node);
        });
    };

    _renderer.fireTSEvent = function(dispatch, drawState) {
        dispatch.transitionsStarted(null);
    };

    _renderer.calculateBounds = function(drawState) {
        if(!drawState.wnodes.length)
            return null;
        return _renderer.parent().calculateBounds(drawState.wnodes, drawState.wedges);
    };

    _renderer.refresh = function(node, edge, edgeHover, edgeLabels, textPaths) {
        if(_animating)
            return _renderer; // but what about changed attributes?
        return _renderer;
    };

    _renderer.reposition = function(node, edge) {
        return _renderer;
    };

    function has_source_and_target(e) {
        return !!e.source && !!e.target;
    }

    _renderer.animating = function() {
        return _animating;
    };

    return _renderer;
};
