/*
 * Copyright 2010 Jhonathan Salguero Villa
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
(function(Cevent, window) {
"use strict";
var math = Math,
    PI = math.PI,
    TWOPI = 2 * PI,
    DEGREE = PI / 180,
    sqrt = math.sqrt,
    pow = math.pow,
    cos = math.cos,
    sin = math.sin,
    round = math.round,
    abs = math.abs,
    acos = math.acos,
    atan2 = math.atan2,
    undefined,
    hasOwnProperty = Object.prototype.hasOwnProperty,
    slice = Array.prototype.slice,
    defaultStyle = {
        tx: 0,
        ty: 0,
        scaleX: 1,
        scaleY: 1,
        skewX: 0,
        skewY: 0,
        fill: "#000",
        stroke: "",
        lineWidth: 1,
        lineJoin: "miter",
        lineCap: "butt",
        alpha: 1,
        rotation: 0,
        composite: "source-over",
        shadowColor: "rgba(0, 0, 0, 0.0)",
        shadowOffsetX: 0,
        shadowOffsetY: 0,
        shadowBlur: 0,
        fontStyle: "normal",
        fontWeight: "normal",
        fontSize: 10,
        fontFamily: "Arial"
    },

    cv = document.createElement("canvas"),
    
    testCtx = cv.getContext && cv.getContext("2d"),
    
    
    // Distancia entre dos puntos
    distance = function(p1, p2) {
        return sqrt(pow(p1.x - p2.x, 2) + pow(p1.y - p2.y, 2));
    },
    
    // Distancia entre un punto y una linea
    // x1, y1, x2, y2  son las coordenadas del segmento de recta
    // solución basada en http://local.wasp.uwa.edu.au/~pbourke/geometry/pointline/
    distanceToLine = function(x1, y1, x2, y2, point) {
        var deltaX = x2 - x1,
            deltaY = y2 - y1,
            closestPoint = {}, u;
        
        if (deltaX === 0 && deltaY === 0) {
            return;
        }
        
        u = ((point.x - x1) * deltaX + (point.y - y1) * deltaY) / (deltaX * deltaX + deltaY * deltaY);
        
        if (u < 0) {
            closestPoint = {x: x1, y: y1};
        } else if (u > 1) {
            closestPoint = {x: x2, y: x2 };
        } else {
            closestPoint = { x: x1 + u * deltaX, y: y1 + u * deltaY};
        }
        
        return distance(closestPoint, point);
    },
    
    // Rotar punto representado por (x, y)
    rotate = function(x, y, angle) {
        angle = DEGREE * angle;
        return {
            x: x * cos(angle) - y * sin(angle),
            y: x * sin(angle) + y * cos(angle)
        };
    },
    
    
    extend = function(orig, obj) {
        var attr;
        for (attr in obj) {
            if (hasOwnProperty.call(obj, attr)) {
                orig[ attr ] = obj[ attr ];
            }
        }
    },

    /*********************
     * Super clase Shape *
     *********************/
    Shape = Class.extend({
        init: function(x, y) {
            this.x = x || 0;
            this.y = y || 0;
            extend(this, defaultStyle);
        },

        // retorna posición real del objeto en el canvas
        // eje: un objeto con posición (50,50) trasladado (5,0) realmente se encuentra en (55,50)
        position: function() {
            var p = rotate(this.x  * this.scaleX, this.y * this.scaleY, this.rotation);

            return {
                x: p.x + this.tx,
                y: p.y + this.ty
            };
        },

        // trasladar coordenadas del objeto
        rmove: function(x, y) {
            this.tx += x;
            this.ty += y;
        },

        // Cambiar propiedades del objeto
        attr: function(attrs, value) {
            var attr;

            if (typeof(attrs) == "string") {
                this[ attrs ] = value;

            } else {
                for (attr in attrs) {
                    this[ attr ] = attrs[ attr ];
                }
            }

            return this;
        },
        
        // aplicar "estilo" al objeto
        applyStyle: function(ctx) {
            var shadowBlur = this.shadowBlur,
                shadowOffsetX = this.shadowOffsetX,
                shadowOffsetY = this.shadowOffsetY;

            ctx.fillStyle = this.fill;
            ctx.globalAlpha = this.alpha;
            ctx.globalCompositeOperation = this.composite;

            if (this.stroke) {
                ctx.strokeStyle = this.stroke;
                ctx.lineWidth = this.lineWidth;
            }

            if (shadowOffsetX || shadowOffsetY || shadowBlur) {
                ctx.shadowColor = this.shadowColor;
                ctx.shadowOffsetX = shadowOffsetX;
                ctx.shadowOffsetY = shadowOffsetY;
                ctx.shadowBlur = shadowBlur;
            }

        },

        // aplicar transformaciones al lienzo
        setTransform: function(ctx) {
            var zoom = Cevent.__zoom,
                scaleX = this.scaleX * zoom,
                scaleY = this.scaleY * zoom,
                skewX = this.skewX * zoom,
                skewY = this.skewY * zoom,
                angle = this.rotation * DEGREE,
                s = sin(angle),
                c = cos(angle),
                dx = this.tx * zoom,
                dy = this.ty * zoom,
                
                // Es mas rápido multiplicar las matrices y usar transform
                // que llamar individualmente a rotate, translate, scale
                m11 = c * scaleX - s * skewY,
                m21 = c * skewX - s * scaleY,
                m12 = s * scaleX + c * skewY,
                m22 = s * skewX + c * scaleY;

            ctx.setTransform(m11, m12, m21, m22, dx, dy);
        },

        draw: function (ctx) {
            throw new Error("El método draw no se ha implementado");
        },
        
        fill_or_stroke: function(ctx) {
            if ( this.fill ) { ctx.fill(); }
            if (this.stroke) { ctx.stroke(); }
        },

        // retorna true si point se encuentra dentro del Objeto
        // Inspirado en canvasShop de Jiwei Xu (http://www.xujiwei.com)
        hitTest: function(point) {
            if (testCtx && testCtx.isPointInPath) {
                this.draw(testCtx);
                // Por algún motivo firefox necesita que el sistema de coordenadas
                // se "restaure"
                testCtx.setTransform(1, 0, 0, 1, 0, 0);
                return testCtx.isPointInPath(point.x, point.y);
            } else {
                throw Error("Método isPointInPath no soportado: Necesita FlashCanvasPro");
            }
        }
    }),

    /*********************
     * Objeto Rectángulo *
     *********************/
    Rect = Shape.extend({
        init: function(x, y, width, height, radius) {
            this.r = radius || 0;
            this.w = width || 5;
            this.h = height || width;
            this._super(x, y);
        },

        draw: function(ctx) {
            var x = this.x,
                y = this.y,
                w = this.w,
                h = this.h;

            this.applyStyle(ctx);
            this.setTransform(ctx);
            ctx.beginPath();
            
            // bordes redondeados
            if (this.r) {
                Cevent.setContext(ctx).polygon(x, y, x+w, y, x+w, y+h, x, y+h, this.r);

            } else {
                ctx.rect(x, y, round(w), round(h));
            }

            ctx.closePath();

            if ( this.fill ) { ctx.fill(); }
            if (this.stroke) { ctx.stroke(); }
        },

        hitTest: function(point) {
            if (this.skewX || this.skewY || this.r) {
                return this._super(point);
            }

            var thisPos = this.position(),
                mousePos = rotate(point.x - thisPos.x, point.y - thisPos.y, -this.rotation);

            //console.log(x+" ,"+y)
            return (mousePos.x >= 0 && mousePos.x <= this.w * this.scaleX &&
                    mousePos.y >= 0 && mousePos.y <= this.h * this.scaleY);
        }
    }),
    
    /****************
     * Objeto Texto *
     ****************/
    // extender Rect ya que el texto forma un "rectángulo"
    Text = Rect.extend({
        init: function(x, y, text) {
            this.setText(text);
            this._super(x, y, this.w, this.h);
        },

        applyStyle: function(ctx) {
            ctx.font = this.fontStyle + " " + this.fontWeight + " " +
                       this.fontSize + "px " + this.fontFamily;

            this.h = this.fontSize;
            this.w = ctx.measureText(this.text).width;
            this._super(ctx);
        },

        setText: function(text) {
            this.text = text + "";
        },

        draw: function(ctx) {
            this.applyStyle(ctx);
            this.setTransform(ctx);
            
            // Dibujar texto
            if (this.fill) {
                ctx.fillText(this.text, this.x, this.y + this.h);
            }
            if (this.stroke) {
                ctx.strokeText(this.text, this.x, this.y + this.h);
            }
        },
        
        hitTest: function(point) {
            if (this.skewX || this.skewY && testCtx && testCtx.isPointInPath) {
                this.setTransform(testCtx);
                testCtx.beginPath();
                testCtx.rect(this.x, this.y, this.w, this.h);
                testCtx.closePath();
                return testCtx.isPointInPath(point.x, point.y);
            }

            return this._super(point);
        }
        
    }),
    
    imageCache = {},

    /*****************
     * Objeto Imagen *
     *****************/
    Img = Rect.extend({
        init: function(x, y, src) {
            this.setImg(src);
            this._super(x, y, this.img.width, this.img.height);
        },

        setImg: function(img) {
            if (imageCache[img]) {
                this.img = imageCache[img];
                this.src = this.img.src;
                return;
            }

            if (img.nodeName == "IMG") {
                this.img = img;

            } else {
                img += "";
                this.img = imageCache[img] = new Image();
                this.img.src = img;
            }
            this.img.onload = function() {
                Cevent.forse_redraw();
            };

            this.src = this.img.src;
        },

        draw: function(ctx) {
            var x = this.x,
                y = this.y;
                
            this.w = this.img.width;
            this.h = this.img.height;

            this.applyStyle(ctx);
            this.setTransform(ctx);

            if (ctx === testCtx) {
                ctx.beginPath();
                ctx.rect(x, y, round(this.w), round(this.h));
                ctx.closePath();
            } else {
                ctx.drawImage(this.img, x, y);
            }
        }
    }),

    /*****************
     * Objeto Elipse *
     *****************/
    Ellipse = Rect.extend({
        // Extraído de Processing http://processingjs.org
        draw: function(ctx) {
            var x = this.x,
                y = this.y,
                w = this.w,
                h = this.h,
                C = 0.5522847498307933,
                c_x = C * w,
                c_y = C * h;

            
            this.applyStyle(ctx);
            this.setTransform(ctx);

            ctx.beginPath();

            ctx.moveTo(x + w, y);
            ctx.bezierCurveTo(x + w, y - c_y, x + c_x, y - h, x, y - h);
            ctx.bezierCurveTo(x - c_x, y - h, x - w, y - c_y, x - w, y);
            ctx.bezierCurveTo(x - w, y + c_y, x - c_x, y + h, x, y + h);
            ctx.bezierCurveTo(x + c_x, y + h, x + w, y + c_y, x + w, y);

            ctx.closePath();

            if (this.fill) { ctx.fill(); }
            if (this.stroke) { ctx.stroke(); }

        },

        hitTest: Shape.prototype.hitTest
    }),

    /******************
     * Objeto Arco    *
     ******************/
    Arc = Shape.extend({
        init: function(x, y, radius, startAngle, endAngle, antiClockWise) {
            this.clockwise = antiClockWise;
            this.endAngle = endAngle;
            this.startAngle = startAngle;
            this.r = radius;
            this._super(x, y);
        },

        draw: function (ctx) {
            var x = this.x,
                y = this.y;

            this.applyStyle(ctx);
            this.setTransform(ctx);

            ctx.beginPath();
            ctx.arc(
                x,
                y,
                round(this.r),
                this.startAngle || PI * 2,
                this.endAngle || 0, !!this.clockwise
            );
            ctx.lineTo(x, y);
            ctx.closePath();

            if ( this.fill ) { ctx.fill(); }
            if (this.stroke) { ctx.stroke(); }

        }
    }),


    /******************
     * Objeto Circulo *
     ******************/
    Circle = Shape.extend({
        init: function(x, y, radius) {
            this.r = radius || 5;
            this._super(x, y);
        },

        draw: function (ctx) {
            var x = this.x,
                y = this.y;

            this.applyStyle(ctx);
            this.setTransform(ctx);

            ctx.beginPath();
            ctx.arc(
                x,
                y,
                round(this.r),
                0, PI * 2, true
           );
            ctx.closePath();

            if ( this.fill ) { ctx.fill(); }
            if (this.stroke) { ctx.stroke(); }

        },

        hitTest: function(point) {
            if (this.skewX || this.skewY || this.scaleX !== this.scaleY) {
                return this._super(point);
            }

            var lineWidth = !!this.stroke && this.lineWidth,
                thisPos = this.position();

            return distance(point, thisPos) <= (this.r + lineWidth) * this.scaleX;
        }
    }),
    
    /****************
     * Objeto Linea *
     ****************/
    Line = Shape.extend({
        init: function(x1, y1, x2, y2) {
            this.x2 = x2;
            this.y2 = y2;
            this._super(x1, y1);
            this.stroke = "#000";
        },
        
        rmove: function(x, y) {
            this.x += x;
            this.y += y;
            this.x2 += x;
            this.y2 += y;
        },
        
        applyStyle: function(ctx) {
            ctx.lineJoin = this.lineJoin;
            ctx.lineCap =  this.lineCap;
            this._super(ctx);
        },

        draw: function(ctx) {
            this.applyStyle(ctx);
            this.setTransform(ctx);

            ctx.beginPath();
            ctx.moveTo(this.x,  this.y);
            ctx.lineTo(this.x2, this.y2);
            ctx.stroke();

        },

        hitTest: function(point) {
            return distanceToLine(this.x, this.y, this.x2, this.y2, point) <= this.lineWidth+2;
        }
    }),
    
/*
 * El siguiente código proviene de canto.js (http://code.google.com/p/canto-js)
 * Copyright 2010 David Flanagan
 * Released under the MIT license (http://www.opensource.org/licenses/mit-license.php)
 */
    currentX,
    currentY,
    startSubpathX,
    startSubpathY,
    _lastCCP = null,
    _lastQCP = null,
    _pathIsEmpty = false,
    
    // Letra contemplada en SVG seguida de números (opcional) separados por comas o espacios
    SVGPATTERN = /[MmLlZzHhVvCcQqSsTtAa]\s*([\-+]?(?:\d+[.]?\d*|[.]\d+)(?:[Ee][\-+]?\d+)?[,\s]*)*/g,
    // Números que captura esta regex
    // 1, 5, -4, -5, +9
    // 5e-2, 4E3, +4e9
    // -0.4, 3.14, .54
    NUMBER = /[\-+]?(?:\d+[.]?\d*|[.]\d+)(?:[Ee][\-+]?\d+)?/g,

    angleBetweenVectors = function (x1, y1, x2, y2) {
        var dotproduct = x1 * x2 + y1 * y2,
            d1 = sqrt(x1 * x1 + y1 * y1),
            d2 = sqrt(x2 * x2 + y2 * y2),
            x = dotproduct / (d1 * d2),
            angle, sign;

        // Rounding errors can cause x to be slightly greater than 1
        if (x > 1) {
            x = 1;

        } else if (x < -1) {
            x = -1;
        }

        angle = abs(acos(x));
        sign = x1 * y2 - y1 * x2;

        return sign === abs(sign) ? angle : -angle;
    },
    
    rotatePoint = function (x, y, angle) {
        return [ x * cos(angle) - y * sin(angle),
                 y * cos(angle) + x * sin(angle)];
    },
    
    // A utility function: if there is no current supath, then start one
    // at this point.  This is from the spec.
    ensure = function(self, x, y) {
        if (_pathIsEmpty) {
            self.ctx.moveTo(x, y);
        }
    },

    setCurrent = function(x, y) {
        currentX = x;
        currentY = y;
        _lastCCP = null;  // Reset control point status
        _lastQCP = null;
        _pathIsEmpty = false;
    },

    // Check that the current point is defined and throw an exception if
    // it is not defined.  This is used by relative motion commands.
    checkcurrent = function() {
        if (currentX === undefined) {
            throw new Error("No current point; can't use relative coordinates");
        }
    },

    // Utility to check that args.length === n or (args.length % m) === n
    // and that args.length < min. Throws an error otherwise.
    // Only the first two arguments are required
    check = function(args, n, m, min) {
        if (n !== (m ? args.length % m : args.length) || args.length < min) {
            throw new Error("wrong number of arguments");
        }
    },
    
    /*
     * SVG path commands
     * Many of these functions also work as extended canvas methods.
     * M and L, for example are compatible with moveTo and lineTo
     */

    M = function(x, y) {
        this.ctx.moveTo(x, y);

        setCurrent(x, y);
        startSubpathX = x;
        startSubpathY = y;

        if (arguments.length > 2) {
            L.apply(this, slice.call(arguments, 2));
        }

        return this;
    },

    // Relative moveto
    m = function(x, y) {
        if (_pathIsEmpty) {
            // From the SVG spec: "If a relative moveto (m) appears as
            // the first element of the path, then it is treated as a
            // pair of absolute coordinates."
            currentX = currentY = 0;
        }
        checkcurrent();

        x += currentX;
        y += currentY;

        this.ctx.moveTo(x, y);

        setCurrent(x, y);
        startSubpathX = x;
        startSubpathY = y;

        if (arguments.length > 2){
            l.apply(this, slice.call(arguments, 2));
        }

        return this;
    },

    // Absolute lineto
    L = function(x, y) {
        var i, l = arguments.length;

        check(arguments, 0, 2, 2);
        ensure(this, x, y); // not SVG: for compatiblity with canvas API
        this.ctx.lineTo(x ,y);

        for (i = 2; i < l; i += 2) {
            this.ctx.lineTo(x = arguments[i], y = arguments[i+1]);
        }

        setCurrent(x, y);
        return this;
    },

    // Relative lineto
    l = function(x, y) {
        var i, cx = currentX, cy = currentY, l = arguments.length;

        check(arguments, 0, 2, 2);
        checkcurrent();
        
        for (i = 0; i < l; i += 2) {
            this.ctx.lineTo(cx += arguments[i], cy += arguments[i+1]);
        }

        setCurrent(cx, cy);
        return this;
    },
    
    // Closepath
    z = function() {
        this.ctx.closePath();
        setCurrent(this, startSubpathX, startSubpathY);
        return this;
    },

    H = function(x) {
        var i, l = arguments.length;
        checkcurrent();

        for (i = 0; i < l; i++) { 
            L.call(this, arguments[i], currentY);
        }

        return this;
    },

    h = function(x) {
        var i, n = arguments.length;

        for(i = 0; i < n; i++) { 
            l.call(this, arguments[i], 0);
        }

        return this;
    },

    V = function(y) {
        var i, l = arguments.length;
        checkcurrent();

        for (i = 0; i < l; i++) { 
            L.call(this, currentX, arguments[i]);
        }
        return this;
    },

    v = function(y) {
        var i, n = arguments.length;

        for (i = 0; i < n; i++) { 
            l.call(this, 0, arguments[i]);
        }
        return this;
    },

    C = function(cx1, cy1, cx2, cy2, x, y) {
        var i, a = arguments, l = arguments.length;

        check(a, 0, 6, 6);
        ensure(this, cx1, cx2); // not SVG: for compatiblity with canvas API

        this.ctx.bezierCurveTo(cx1, cy1, cx2, cy2, x, y);

        for(i = 6; i < l; i +=6) {// polycurves
            this.ctx.bezierCurveTo(a[i], a[i+1], cx2 = a[i+2], cy2 = a[i+3], x = a[i+4], y = a[i+5]);
        }

        setCurrent(x, y);
        _lastCCP = [cx2, cy2];
        return this;
    },

    c = function(cx1, cy1, cx2, cy2, x, y) {
        var i, a = arguments, l = a.length,
            x0 = currentX, y0 = currentY;

        check(a, 0, 6, 6);
        checkcurrent();
        
        for (i = 0; i < l; i+=6) { // polycurves
            this.ctx.bezierCurveTo(x0 + a[i],
                                y0 + a[i+1],
                                cx2 = x0 + a[i+2],
                                cy2 = y0 + a[i+3],
                                x0 += a[i+4],
                                y0 += a[i+5]);
        }

        setCurrent(x0, y0);
        _lastCCP = [cx2,cy2];

        return this;
    },
    
    Q = function(cx, cy, x, y) {
        var i, a = arguments, l = a.length;

        check(arguments, 0, 4, 4);
        ensure(this, cx, cy); // not SVG: canvas API compatibility

        this.ctx.quadraticCurveTo(cx,cy,x,y);

        for (i = 4; i < l; i+=4) {
            this.ctx.quadraticCurveTo(cx=a[i], cy=a[i+1], x=a[i+2], y=a[i+3]);
        }

        setCurrent(x, y);
        _lastQCP = [cx, cy];
        return this;
    },

    q = function(cx, cy, x, y) {
        var i, a = arguments, l = a.length,
            x0 = currentX, y0 = currentY;

        check(arguments, 0, 4, 4);
        checkcurrent();

        for (i = 0; i < l; i+=4) { 
            this.ctx.quadraticCurveTo( cx = x0 + a[i],
                                    cy = y0 + a[i+1],
                                    x0 += a[i+2],
                                    y0 += a[i+3]);
        }

        setCurrent(x0, y0);
        _lastQCP = [cx, cy];
        return this;
    },

    S = function() {    // Smooth bezier curve
        if (!_lastCCP) {
            throw new Error("Last command was not a cubic bezier");
        }

        var i, a = arguments, l = a.length,
            x0 = currentX, y0 = currentY,
            cx0 = _lastCCP[0], cy0 = _lastCCP[1],
            cx1, cx2, cy1, cy2, x, y;
        
        check(arguments, 0, 4, 4);
        checkcurrent();
        
        for (i = 0; i < l; i+=4) {
            cx1 = x0 + (x0 - cx0);
            cy1 = y0 + (y0-cy0);
            cx2 = a[i];
            cy2 = a[i+1];
            x = a[i+2];
            y = a[i+3];

            this.ctx.bezierCurveTo(cx1, cy1, cx2, cy2, x, y);
            x0 = x; y0 = y; cx0 = cx2; cy0 = cy2;
        }

        setCurrent(x0, y0);
        _lastCCP = [cx0,cy0];
        return this;
    },

    s = function() {
        if (!_lastCCP) {
            throw new Error("Last command was not a cubic bezier");
        }
        
        var i, a = arguments, l = a.length,
            x0 = currentX, y0 = currentY,
            cx0 = _lastCCP[0], cy0 = _lastCCP[1],
            cx1, cx2, cy1, cy2, x, y;

        check(arguments, 0, 4, 4);
        checkcurrent();
        
        for (i = 0; i < l; i+=4) {
            cx1 = x0 + (x0 - cx0);
            cy1 = y0 + (y0 - cy0);
            cx2 = x0 + a[i];
            cy2 = y0 + a[i+1];
            x = x0 + a[i+2];
            y = y0 + a[i+3];

            this.ctx.bezierCurveTo(cx1, cy1, cx2, cy2, x, y);
            x0 = x; y0 = y; cx0 = cx2; cy0 = cy2;
        }

        setCurrent(x0, y0);
        _lastCCP = [cx0, cy0];
        return this;
    },

    T = function() {
        if (!_lastQCP) {
            throw new Error("Last command was not a cubic bezier");
        }

        var i, a = arguments, l = arguments.length,
            x0 = currentX, y0 = currentY,
            cx0 = _lastQCP[0], cy0 = _lastQCP[1],
            cx, cy, x, y;

        check(arguments, 0, 2, 2);
        checkcurrent();

        for (i = 0; i < l; i+=2) {
            cx = x0 + (x0 - cx0);
            cy = y0 + (y0 - cy0);
            x = arguments[i];
            y = arguments[i+1];

            this.ctx.quadraticCurveTo(cx, cy, x, y);
            x0 = x; y0 = y; cx0 = cx; cy0 = cy;
        }

        setCurrent(x0, y0);
        _lastQCP = [cx0, cy0];
        return this;
    },

    t = function() {
        if (!_lastQCP) {
            throw new Error("Last command was not a cubic bezier");
        }

        var i, a = arguments, l = a.length,
            x0 = currentX, y0 = currentY,
            cx0 = _lastQCP[0], cy0 = _lastQCP[1],
            cx, cy, x, y;

        check(arguments, 0, 2, 2);
        checkcurrent();
        
        for (i = 0; i < l; i+=2) {
            cx = x0 + (x0 - cx0);
            cy = y0 + (y0 - cy0);
            x = x0 + arguments[i];
            y = y0 + arguments[i+1];
            
            this.ctx.quadraticCurveTo(cx, cy, x, y);
            x0 = x; y0 = y; cx0 = cx; cy0 = cy;
        }

        setCurrent(x0, y0);
        _lastQCP = [cx0, cy0];
        return this;
    },

        // Draw an ellipse segment from the current point to (x,y)
        // XXX: is this supposed to allow multiple arcs in a single call?
    A = function(rx, ry, rotation, big, clockwise, x, y) {
        // This math is from Appendix F, Implementation Notes of 
        // the SVG specification.  See especially F.6.5.
        // http://www.w3.org/TR/SVG/implnote.html#ArcImplementationNotes

        // If either radius is 0, then just do a straight line
        if (!rx || !ry) {
            return L.call(this, x, y);
        }

        // Convert the flags to their boolean equivalents
        big = !!big;
        clockwise = !!clockwise;

        checkcurrent();

        var x1 = currentX, y1 = currentY,  // start point of arc
            x2 = x, y2 = y,                  // end point of arc

            // SVG specifies angles in degrees.  Convert to radians
            // and precompute some trig.
            phi = rotation * DEGREE,
            sinphi = sin(phi),
            cosphi = cos(phi),

            // Now, using the formulae in F.6.5 we compute the center point
            // (cx,cy) of the ellipse along with the start angle theta1
            // and the end angle theta2.  The variable names below use $
            // instead of ' as a prime marker

            // F.6.5.1: Step 1: compute(x1$, y1$)
            tx = (x1 - x2) / 2,
            ty = (y1 - y2) / 2,
            x1$ =  cosphi * tx + sinphi * ty,
            y1$ = -sinphi * tx + cosphi * ty,
            lambda, cx$, cy$, cx, cy, theta1, theta2, dtheta;

        // F.6.6: Step 1.5: correct radii if necessary: 
        rx = abs(rx);  // F.6.6.1
        ry = abs(ry);
        lambda = x1$ * x1$ / (rx * rx) + y1$ * y1$ / (ry * ry); // F.6.6.2
        
        if (lambda > 1) { 
            // If this value is > 1, then the radii need to be adjusted
            // and we can skip step 2 below
            rx *= sqrt(lambda);
            ry *= sqrt(lambda);
            cx$ = cy$ = 0;

        } else {
            // F.6.5.2: Step 2: Compute (cx$, cy$): 
            // The radii weren't adjusted and we have to compute this
            var rxrx = rx * rx,
                ryry = ry * ry,
                x1x1$ = x1$ * x1$,
                y1y1$ = y1$ * y1$,
                t = rxrx * y1y1$ + ryry * x1x1$;
                t = sqrt(rxrx * ryry / t -1);

            if (big === clockwise) {
                t = -t;
            }
            cx$ = t * rx * y1$ / ry;
            cy$ = -t * ry * x1$ / rx;
        }

        // F.6.5.3: Step 3: compute (cx, cy)
        cx = cosphi * (cx$ - sinphi) * (cy$ + (x1 + x2) / 2);
        cy = sinphi * (cx$ + cosphi) * (cy$ + (y1 + y2) / 2);

        // F.6.5.4: Step 4: compute theta1 and theta2
        tx = (x1$ - cx$) / rx;
        ty = (y1$ - cy$) / ry;
        theta1 = angleBetweenVectors(1, 0, tx, ty); // F.6.5.5
        dtheta = angleBetweenVectors(tx, ty, (-x1$ - cx$) / rx, (-y1$ - cy$) / ry); // F.6.5.6
        
        if (clockwise && dtheta < 0) {
            dtheta += TWOPI;

        } else if (!clockwise && dtheta > 0) {
            dtheta -= TWOPI;
        }

        theta2 = theta1 + dtheta;

        // Now after all that computation, we can implement the SVG
        // A command using an extension of the canvas arc() method
        // that allows stretching and rotation
        this.ellipse(cx, cy, rx, ry, phi, theta1, theta2, !clockwise);
        return this;
    },

    a = function(rx, ry, rotation, big, clockwise, x, y) {
        checkcurrent();

        A.call(this, rx, ry, rotation, big, clockwise, x + currentX, y + currentY);

        return this;
    },

    /*
     * More path-related commands that are not part of SVG
     */

    // A generalization of the arc command above to allow x and y radii
    // and to allow rotation.  (The SVG A command uses this)
    // rotation/sa/ea => in radians
    ellipse = function(cx, cy, rx, ry, rotation, sa, ea, anticlockwise) {
        rotation = rotation || 0;
        sa = sa || 0;
        ea = ea === undefined ? TWOPI : ea;

        // compute the start and end points
        var sp = rotatePoint(rx * cos(sa), ry * sin(sa), rotation),
            sx = cx + sp[0],
            sy = cy + sp[1],
            ep = rotatePoint(rx * cos(ea), ry * sin(ea), rotation),
            ex = cx + ep[0],
            ey = cy + ep[1];
        ensure(this, sx, sy);
        
        this.ctx.translate(cx, cy);
        this.ctx.rotate(rotation);
        this.ctx.scale(rx / ry, 1);

        this.ctx.arc(0, 0, ry, sa, ea, !!anticlockwise);

        this.ctx.scale(ry / rx, 1);
        this.ctx.rotate(-rotation);
        this.ctx.translate(-cx, -cy);

        setCurrent(ex, ey);
        return this;
    },

    // TODO: reemplazar arcTo en CanvasRenderingContext2D.prototype
    polygon = function() {
        var i, a = arguments, l = a.length;
        // Need at least 3 points for a polygon
        if (l < 6) {
            throw new Error("not enough arguments");
        }
        
        if (l % 2 === 0) {
            this.ctx.moveTo(a[0], a[1]);

            for (i = 2; i < l; i+=2) {
                this.ctx.lineTo(a[i], a[i+1]);
            }

        } else {
            // If the number of args is odd, then the last is corner radius
            var radius = a[l-1],
                n = (l - 1) / 2,

                // Begin at the midpoint of the first and last points
                x0 = (a[n*2-2] + a[0]) / 2,
                y0 = (a[n*2-1] + a[1]) / 2,
                temp_x, temp_y;

            this.ctx.moveTo(x0, y0);

            // Now arcTo each of the remaining points
            for (i = 0; i < n-1; i++) {
                this.ctx.arcTo(temp_x = a[i*2], temp_y = a[i*2+1], a[i*2+2], a[i*2+3], radius, x0, y0);
                x0 = temp_x; y0 = temp_y;
            }

            // Final arcTo back to the start
            this.ctx.arcTo(a[n*2-2], a[n*2-1], a[0], a[1], radius, x0, y0);
        }

        return this;
    },

    // Parse an SVG path string and invoke the various SVG commands
    // Note that this does not call beginPath()
    parseSVG = function(svg) {
        var matches = svg.match(SVGPATTERN),
            match, parts, args, i, j, path = [];

        if (!matches) {
            throw new Error("Bad path: " + svg);
        }

        // Each element of matches should begin with a SVG path letter
        // and be followed by a string of numbers separated by spaces
        // and/or commas
        for(i = 0; (match = matches[i]); i++) {
            args = [];
            args.cmd = match.charAt(0);
            // Get rest and trim whitespace from it
            parts = match.match(NUMBER) || [];

            for(j = 0; j < parts.length; j++) {
                args[j] = +parts[j];
            }

            path.push(args);
        }

        return path;
    },

    Path = Shape.extend({
        init: function(svgpath) {
            this.svgpath = parseSVG(svgpath);
            this._super(0, 0);
            
            if (this.svgpath[0].cmd.toLowerCase() == "m") {
                this.x = this.svgpath[0][0];
                this.y = this.svgpath[0][1];
            }
        },

        draw: function (ctx) {
        var svgpath = this.svgpath, i, l;

            this.applyStyle(ctx);
            this.setTransform(ctx);

            ctx.beginPath();
            Cevent.setContext(ctx);

            for (i = 0, l = svgpath.length; i < l ; i++) {
                Cevent[ svgpath[i].cmd ].apply(Cevent, svgpath[i]);
            }

            if (this.fill) { ctx.fill(); }
            if (this.stroke) { ctx.stroke(); }

        }
        
    });

// extender canvas-event con métodos svg
extend(Cevent, {
    
    // distancia entre dos puntos
    // distance({x:100, y:45}, {x:13, y:99}) => 102.3
    distance: distance,
    
    __zoom: 1,
    
    Shape: Shape,
    // iniciar encadenamiento, ejemplo:
    //    Cevent.setContext(ctx).M(50, 50).h(50).v(-50).z();
    //    ctx.fill();
    setContext: function(ctx) {
        this.ctx = ctx;
        // reset flags
        setCurrent(0,0);
        
        ctx.beginPath();
        return this;
    },

    polygon: polygon,
    
    ellipse: ellipse,
    
    // Svg commands

    /** @see #moveTo */
    M: M,
    /** @see #rmoveTo */
    m: m,
    /** @see #lineTo */
    L: L,
    /** @see #rlineTo */
    l: l,
    /**
     * Draws a horizontal line from the current point to the
     * specified X coordinate.
     */
    H: H,
    /** Draws a horizontal line using relative coordinates */
    h: h,
    /**
     * Draws a vertical line from the current point to the
     * specified Y coordinate.
     */
    V: V,
    /** Draws a vertical line using relative coordinates */
    v: v,
    /** @see #bezierCurveTo */
    C: C, 
    /** @see #rbezierCurveTo */
    c: c,
    /** 
     * The SVG S path element: adds another cubic bezier to the path, 
     * using the reflection of the last cubic control point as the
     * first control point for this curve. Only valid if the last 
     * path segment was a C, c, S, or s.
     */
    S: S,
    /** The relative-coordinate version of S(). */
    s: s,
    /** @see #quadraticCurveTo */
    Q: Q,
    /** @see #rquadraticCurveTo */
    q: q,
    /** 
     * The SVG T path element: adds another quadratic bezier to the path, 
     * using the reflection of the last quadratic control point as the
     * control point for this curve. Only valid if the last path segment
     * was a Q, q, T or t.
     */
    T: T,
    /** The relative-coordinate version of T */
    t: t,
    /**
     * The SVG A path element: connects the current point to the point
     * specified by the last two arguments with the portion of an ellipse
     * specified by the other arguments.  See the SVG spec for details
     * of this complicated command.
     */
    A: A,
    /** The relative-coordinate version of a */
    a: a,
    /** @see #closePath */
    Z: z,
    /** @see #closePath */
    z: z
});

// verificar que arcTo este bien implementado, de lo contrario reemplazarlo
(function() {
// excanvas/FlashCanvas
if (!testCtx) { return; }

var rect = Rect(40, 40, 40, 40, 5);
    rect.draw(testCtx);

// si esta bien implementado esto debe ser 255
if (!testCtx.getImageData(79, 60, 1, 1).data[3]) {
    var originalArcTo = CanvasRenderingContext2D.prototype.arcTo;
    // Código adaptado de (http://philip.html5.org/demos/canvas/arcto-emulate.html)
    // Copyright (c) 2009 Philip Taylor
    // Released under the MIT license (http://www.opensource.org/licenses/mit-license.php)
    var dist2 = function (x0, y0, x1, y1) {
        return (x0 - x1) * (x0 - x1) + (y0 - y1) *(y0 - y1);
    }

    CanvasRenderingContext2D.prototype.arcTo = function(x1, y1, x2, y2, radius, x0, y0) {
        
        // aplicar método original si no se suplen x0, y0
        if (isNaN(x0 + y0)) { 
            return originalArcTo.apply(this, arguments);
        }

        var dir, a2, b2, c2, cosx, sinx, 
            d, anx, any, bnx, bny, x3, y3, 
            x4, y4, ccw, cx, cy, a0, a1;
    
        // If the point (x0, y0) is equal to the point (x1, y1),
        // or if the point (x1, y1) is equal to the point (x2, y2),
        // or if the radius radius is zero, then the method must add the point (x1, y1) to the subpath
        // and connect that point to the previous point (x0, y0) by a straight line.
        if ((x1 == x0 && y1 == y0) || (x1 == x2 && y1 == y2) || radius == 0) {
            this.lineTo(x1, y1);
            return;
        }
        // Otherwise, if the points (x0, y0), (x1, y1), and (x2, y2) all lie on a single straight line, 
        // then the method must add the point (x1, y1) to the subpath,
        // and connect that point to the previous point (x0, y0) by a straight line.
        dir = (x2 - x1) * (y0 - y1) + (y2 - y1) * (x1 - x0);
        if (dir == 0) {
            // In the case where p0->p1 and p1->p2 are opposite directions,
            // this code matches the proposal in
            // http://lists.whatwg.org/pipermail/whatwg-whatwg.org/2009-January/018313.html
            // rather than the spec (as of 2009-03-20)
            this.lineTo(x1, y1);
            return;
        }

        a2 = dist2(x0, y0, x1, y1);
        b2 = dist2(x1, y1, x2, y2);
        c2 = dist2(x0, y0, x2, y2);
        cosx = (a2 + b2 - c2) / (2 * sqrt(a2 * b2));
        
        a2 = sqrt(a2);
        b2 = sqrt(b2);

        sinx = sqrt(1 - cosx * cosx);
        d = radius*sinx / (1 - cosx);

        anx = (x1-x0) / a2;
        any = (y1-y0) / a2;
        bnx = (x1-x2) / b2;
        bny = (y1-y2) / b2;
        x3 = x1 - anx * d;
        y3 = y1 - any * d;
        x4 = x1 - bnx * d;
        y4 = y1 - bny * d;
        ccw = (dir < 0);
        cx = x3 + any * radius * (ccw ? 1 : -1);
        cy = y3 - anx * radius * (ccw ? 1 : -1);
        a0 = atan2(y3 - cy, x3 - cx);
        a1 = atan2(y4 - cy, x4 - cx);
        this.lineTo(x3, y3);
        this.arc(cx, cy, radius, a0, a1, ccw);
    };
}
})();

// excanvas no soporta isPointInPath :(
if (window.FlashCanvas) {
    // El elemento debe estar en el DOM para inicializar FlashCanvas
    document.body.appendChild(cv);
    FlashCanvas.initElement(cv);
    testCtx = cv.getContext("2d");
    cv.style.display = "none";
}

if (testCtx) {
// Mayor rendimiento en hitTest http://jsperf.com/canvas-event-js-hittest-performance
testCtx.fill = testCtx.stroke = function(){};
}



/* Registrar Objetos */
Cevent.register("image", Img);
Cevent.register("circle", Circle);
Cevent.register("arc", Arc);
Cevent.register("ellipse", Ellipse);
Cevent.register("rect", Rect);
Cevent.register("text", Text);
Cevent.register("line", Line);
Cevent.register("path", Path);
})(Cevent, this);
