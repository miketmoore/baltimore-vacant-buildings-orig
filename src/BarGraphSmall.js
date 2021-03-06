var React = require('react');
var ReactDOM = require('react-dom');

module.exports = React.createClass({
    getDefaultProps () {
        return {
            data: [],
            selectedLabels: new Set(),
            prefix: '',
            displayLabels: false,
            bgroundcolor: '#000000',
            hoverLabelColor: 'black',
            hoverLabelDefault: 'Hover for info, click to filter',
            viewWidth: 250,
            viewHeight: 110,
            barMargin: 6,
            barMin: 10,
            barMax: 85,
            clickHandler: function () {},
            clickHandlerB: function () {},
            bgroundClickHandler: function () {}
        };
    },
    getInitialState () {
        return {
            preparedData: [],
            min: 0,
            max: 0,
            minY: 0,
            maxY: 0,
            minNormal: 0,
            maxNormal: 0
        };
    },
    _sortDataBySize (data) {
        return data.sort(function (a,b) {
            a = a.size;
            b = b.size;
            if (a < b) return -1;
            else if (a > b) return 1;
            return 0;
        });
    },
    _determineMinAndMax (data) {
        // determine min and max
        var obj, size, min, max;
        for (var i = 0; i < data.length; i++) {
            obj = data[i];
            size = obj.size;
            if (typeof min === 'undefined') min = size;
            if (typeof max === 'undefined') max = size;
            if (size < min) min = size;
            if (size > max) max = size;
        }
        return [min, max];
    },
    _normalize (data) {
        // Normalize range
        // Convert range A-B to scale of C-D
        // y = 1 + (x-A)*(10-1)/(B-A)

        var minNormal;
        var maxNormal;
        if (data.length) {

            var A = data[0].size;
            var B = data[data.length-1].size;
            var C = this.props.barMin;
            var D = this.props.barMax;
            var x;
            var y;
            for ( var i = 0; i < data.length; i++ ) {
                x = data[i].size;
                if (x == 0) {
                    data[i].normalized = C;
                } else {
                    y = C + (x-A)*(D-C)/(B-A);
                    data[i].normalized = y;
                    if (typeof minNormal === 'undefined') minNormal = y;
                    if (typeof maxNormal === 'undefined') maxNormal = y;
                    if (y > maxNormal) maxNormal = y;
                    else if (y < minNormal) minNormal = y;
                }

            }
        }
        return [minNormal,maxNormal];
    },
    _map (data) {
        data = this._sortDataBySize(data);
        var range = this._determineMinAndMax(data);
        var rangeNormalized = this._normalize(data);
        data = this.props.sort ? data.sort(this.props.sort) : data.sort(this._defaultSort);
        return {
            preparedData: data,
            min: range[0],
            max: range[1],
            minNormal: rangeNormalized[0],
            maxNormal: rangeNormalized[1],
            minY: this.props.viewHeight - Math.ceil(rangeNormalized[1]),
            maxY: this.props.viewHeight - Math.ceil(rangeNormalized[0])
        };
    },
    _defaultSort (a,b) {
        a = a.label;
        b = b.label;
        if (a < b) return -1;
        if (a > b ) return 1;
        return 0;
    },
    _drawBars (pscope, drawData, hoverLabel) {
        var obj;
        var preparedData = drawData.preparedData;
        var barWidth = ((this.props.viewWidth - this.props.barMargin) / preparedData.length) - this.props.barMargin;
        var barHeight; // diff per bar
        //var x = (this.props.viewWidth - (this.props.barWidth + this.props.barMargin)) / 2;
        var x = this.props.barMargin;
        var y = 0;
        var rect;
        var text;
        var thisY;

        function addMouseHandlers (path, data) {
            path.data = data;
            path.data.isSelected = this.props.selectedLabels.has(data.label);

            path.on('mousedown', function (e) {
                var item = e.target;
                if (!item.data.isSelected) {
                    this.props.clickHandler(data);
                } else {
                    this.props.clickHandlerB(data);
                }
            }.bind(this));

            path.on('mouseenter', function (e) {
                var item = e.target;
                document.body.style.cursor = 'pointer';
                if (!item.data.isSelected && (item.className != 'PointText')) {
                    // not selected so show slightly darker hue
                    item.fillColor = this.props.barcolorhover;
                }
                hoverLabel.content = item.data.label + ' (' + item.data.size + ')';
            }.bind(this));

            path.on('mouseleave', function (e) {
                var item = e.target;
                document.body.style.cursor = 'auto';
                if (!item.data.isSelected && (item.className != 'PointText')) {
                    // not selected so show default color
                    item.fillColor = this.props.barcolor;
                }
                hoverLabel.content = this.props.hoverLabelDefault;
            }.bind(this));
        }
        for ( var i = 0; i < preparedData.length; i++ ) {

            obj = preparedData[i];
            barHeight = Math.ceil(obj.normalized);
            thisY = this.props.viewHeight - barHeight;
            rect = new pscope.Path.Rectangle({
                point: new pscope.Point({
                    x: x,
                    y: thisY
                }),
                size: new pscope.Size(barWidth, barHeight),
                style: {
                    fillColor: (this.props.selectedLabels.has(obj.label)) ? this.props.barcolorselected : this.props.barcolor
                }
            });
            addMouseHandlers.call(this, rect, obj);

            if (this.props.displayLabels) {
                text = new pscope.PointText({
                    point: new pscope.Point({
                        x: rect.bounds.bottomCenter.x,
                        y: rect.bounds.bottomCenter.y - 2
                    }),
                    content: obj.label,
                    justification: 'center',
                    fontSize: 12,
                    fontFamily: 'sans-serif',
                    fillColor: this.props.fontcolora
                });
                addMouseHandlers.call(this, text, obj);
                text = new pscope.PointText({
                    point: new pscope.Point({
                        x: rect.bounds.topCenter.x,
                        y: rect.bounds.topCenter.y - 1
                    }),
                    content: parseInt(obj.size).toLocaleString(),
                    justification: 'center',
                    fontSize: 12,
                    fontFamily: 'sans-serif',
                    fillColor: this.props.fontcolorb
                });
                addMouseHandlers.call(this, text, obj);
            }

            x += barWidth + this.props.barMargin;
        }
    },
    _drawBackground (pscope) {
        var path = new pscope.Path.Rectangle({
            point: [0,0],
            size: [this.props.viewWidth, this.props.viewHeight],
            style: {
                strokeWidth: 0,
                fillColor: this.props.bgroundcolor
            }
        });
        path.on('mousedown', function () {
            // User can click the background
            this.props.bgroundClickHandler();
        }.bind(this));
    },
    _drawHoverLabel (pscope) {
        return new pscope.PointText({
            point: [3,14],
            content: this.props.hoverLabelDefault,
            fontSize: 14,
            fillColor: this.props.hoverLabelColor
        });
    },
    _draw (canvas) {
        window.paper = this.props.paper;
        var pscope = this.props.paper;
        if (canvas) pscope.setup(canvas);
        this._drawBackground(pscope);
        var hoverLabel = this._drawHoverLabel(pscope);
        var resp = this._map(this.props.data);
        this._drawBars(pscope, resp, hoverLabel);
        pscope.view.update();
        var dims = {
            width: this.props.viewWidth,
            height: this.props.viewHeight
        };
        this.props.paper.project.view.viewSize = new paper.Size(dims);
        this.props.paper.project.view.update();
    },
    componentDidUpdate () {
        this._draw();
    },
    componentDidMount () {
        var canvas = this.refs.canvas;
        this._draw(canvas);
    },
    render () {
        return (
            <canvas ref="canvas" resize></canvas>
        );
    }
});
