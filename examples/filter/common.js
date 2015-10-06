window.NUMBER_OF_CIRCLES = 500;

window.numbersLib = {
    generateRandomNumber: function () {
        return Math.ceil(Math.random() * 99);
    },
    alternateNumber: window.alternateNumber = function (oldNum) {
        var isEven = oldNum % 2 === 0;
        var isOdd = ! isEven;
        var isLessThan = oldNum < 50;
        var isGreaterThan = ! isLessThan;
        var rand = Math.round(Math.random() * 24); // 0 - 24

        if (isEven && isLessThan) {
            num = rand * 2 + 1 + 50; // Odd (51 - 99)
        } else if (isEven && isGreaterThan) {
            num = rand * 2 + 1; // Even (1 - 49)
        } else if (isOdd && isLessThan) {
            num = rand * 2 + 50; // Even (50 - 98)
        } else if (isOdd && isGreaterThan) {
            num = rand * 2; // Even (0 - 48)
        }

        return num;
    }
};




/**
 * @author mrdoob / http://mrdoob.com/
 * @author jetienne / http://jetienne.com/
 * @author paulirish / http://paulirish.com/
 */
var MemoryStats = function() {

    var msMin = 100;
    var msMax = 0;

    var container = document.createElement('div');
    container.id = 'stats';
    container.style.cssText = 'width:80px;opacity:0.9;cursor:pointer';

    var msDiv = document.createElement('div');
    msDiv.id = 'ms';
    msDiv.style.cssText = 'padding:0 0 3px 3px;text-align:left;background-color:#020;';
    container.appendChild(msDiv);

    var msText = document.createElement('div');
    msText.id = 'msText';
    msText.style.cssText = 'color:#0f0;font-family:Helvetica,Arial,sans-serif;font-size:9px;font-weight:bold;line-height:15px';
    msText.innerHTML = 'Memory';
    msDiv.appendChild(msText);

    var msGraph = document.createElement('div');
    msGraph.id = 'msGraph';
    msGraph.style.cssText = 'position:relative;width:74px;height:30px;background-color:#0f0';
    msDiv.appendChild(msGraph);

    while (msGraph.children.length < 74) {

        var bar = document.createElement('span');
        bar.style.cssText = 'width:1px;height:30px;float:left;background-color:#131';
        msGraph.appendChild(bar);

    }

    var updateGraph = function(dom, height, color) {

        var child = dom.appendChild(dom.firstChild);
        child.style.height = height + 'px';
        if (color) child.style.backgroundColor = color;

    }

    var perf = window.performance || {};
    // polyfill usedJSHeapSize
    if (!perf && !perf.memory) {
        perf.memory = {
            usedJSHeapSize: 0
        };
    }
    if (perf && !perf.memory) {
        perf.memory = {
            usedJSHeapSize: 0
        };
    }

    // support of the API?
    if (perf.memory.totalJSHeapSize === 0) {
        console.warn('totalJSHeapSize === 0... performance.memory is only available in Chrome .')
    }

    // TODO, add a sanity check to see if values are bucketed.
    // If so, reminde user to adopt the --enable-precise-memory-info flag.
    // open -a "/Applications/Google Chrome.app" --args --enable-precise-memory-info

    var lastTime = Date.now();
    var lastUsedHeap = perf.memory.usedJSHeapSize;
    return {
        domElement: container,

        update: function() {

            // refresh only 30time per second
            if (Date.now() - lastTime < 1000 / 30) return;
            lastTime = Date.now()

            var delta = perf.memory.usedJSHeapSize - lastUsedHeap;
            lastUsedHeap = perf.memory.usedJSHeapSize;
            var color = delta < 0 ? '#830' : '#131';

            var ms = perf.memory.usedJSHeapSize;
            msMin = Math.min(msMin, ms);
            msMax = Math.max(msMax, ms);
            msText.textContent = "Mem: " + bytesToSize(ms, 2);

            var normValue = ms / (30 * 1024 * 1024);
            var height = Math.min(30, 30 - normValue * 30);
            updateGraph(msGraph, height, color);

            function bytesToSize(bytes, nFractDigit) {
                var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
                if (bytes == 0) return 'n/a';
                nFractDigit = nFractDigit !== undefined ? nFractDigit : 0;
                var precision = Math.pow(10, nFractDigit);
                var i = Math.floor(Math.log(bytes) / Math.log(1024));
                return Math.round(bytes * precision / Math.pow(1024, i)) / precision + ' ' + sizes[i];
            };
        }

    }

};





var Monitoring = Monitoring || (function() {

    var stats = new MemoryStats();
    stats.domElement.style.position = 'fixed';
    stats.domElement.style.right = '0px';
    stats.domElement.style.bottom = '0px';
    document.body.appendChild(stats.domElement);
    requestAnimationFrame(function rAFloop() {
        stats.update();
        requestAnimationFrame(rAFloop);
    });

    var RenderRate = function() {
        var container = document.createElement('div');
        container.id = 'stats';
        container.style.cssText = 'width:150px;opacity:0.9;cursor:pointer;position:fixed;right:80px;bottom:0px;';

        var msDiv = document.createElement('div');
        msDiv.id = 'ms';
        msDiv.style.cssText = 'padding:0 0 3px 3px;text-align:left;background-color:#020;';
        container.appendChild(msDiv);

        var msText = document.createElement('div');
        msText.id = 'msText';
        msText.style.cssText = 'color:#0f0;font-family:Helvetica,Arial,sans-serif;font-size:9px;font-weight:bold;line-height:15px';
        msText.innerHTML = 'Repaint rate: 0/sec';
        msDiv.appendChild(msText);

        var bucketSize = 20;
        var bucket = [];
        var lastTime = Date.now();
        return {
            domElement: container,
            ping: function() {
                var start = lastTime;
                var stop = Date.now();
                var rate = 1000 / (stop - start);
                bucket.push(rate);
                if (bucket.length > bucketSize) {
                    bucket.shift();
                }
                var sum = 0;
                for (var i = 0; i < bucket.length; i++) {
                    sum = sum + bucket[i];
                }
                msText.textContent = "Repaint rate: " + (sum / bucket.length).toFixed(2) + "/sec";
                lastTime = stop;
            }
        }
    };

    var renderRate = new RenderRate();
    document.body.appendChild(renderRate.domElement);

    return {
        memoryStats: stats,
        renderRate: renderRate
    };

})();




// randomColor by David Merfield under the MIT license
// https://github.com/davidmerfield/randomColor/

;
(function(root, factory) {

    // Support AMD
    if (typeof define === 'function' && define.amd) {
        define([], factory);

        // Support CommonJS
    } else if (typeof exports === 'object') {
        var randomColor = factory();

        // Support NodeJS & Component, which allow module.exports to be a function
        if (typeof module === 'object' && module && module.exports) {
            exports = module.exports = randomColor;
        }

        // Support CommonJS 1.1.1 spec
        exports.randomColor = randomColor;

        // Support vanilla script loading
    } else {
        root.randomColor = factory();
    };

}(this, function() {

    // Seed to get repeatable colors
    var seed = null;

    // Shared color dictionary
    var colorDictionary = {};

    // Populate the color dictionary
    loadColorBounds();

    var randomColor = function(options) {
        options = options || {};
        if (options.seed && !seed) seed = options.seed;

        var H, S, B;

        // Check if we need to generate multiple colors
        if (options.count != null) {

            var totalColors = options.count,
                colors = [];

            options.count = null;

            while (totalColors > colors.length) {
                colors.push(randomColor(options));
            }

            options.count = totalColors;

            //Keep the seed constant between runs.
            if (options.seed) seed = options.seed;

            return colors;
        }

        // First we pick a hue (H)
        H = pickHue(options);

        // Then use H to determine saturation (S)
        S = pickSaturation(H, options);

        // Then use S and H to determine brightness (B).
        B = pickBrightness(H, S, options);

        // Then we return the HSB color in the desired format
        return setFormat([H, S, B], options);
    };

    function pickHue(options) {

        var hueRange = getHueRange(options.hue),
            hue = randomWithin(hueRange);

        // Instead of storing red as two seperate ranges,
        // we group them, using negative numbers
        if (hue < 0) {
            hue = 360 + hue
        }

        return hue;

    }

    function pickSaturation(hue, options) {

        if (options.luminosity === 'random') {
            return randomWithin([0, 100]);
        }

        if (options.hue === 'monochrome') {
            return 0;
        }

        var saturationRange = getSaturationRange(hue);

        var sMin = saturationRange[0],
            sMax = saturationRange[1];

        switch (options.luminosity) {

            case 'bright':
                sMin = 55;
                break;

            case 'dark':
                sMin = sMax - 10;
                break;

            case 'light':
                sMax = 55;
                break;
        }

        return randomWithin([sMin, sMax]);

    }

    function pickBrightness(H, S, options) {

        var brightness,
            bMin = getMinimumBrightness(H, S),
            bMax = 100;

        switch (options.luminosity) {

            case 'dark':
                bMax = bMin + 20;
                break;

            case 'light':
                bMin = (bMax + bMin) / 2;
                break;

            case 'random':
                bMin = 0;
                bMax = 100;
                break;
        }

        return randomWithin([bMin, bMax]);

    }

    function setFormat(hsv, options) {

        switch (options.format) {

            case 'hsvArray':
                return hsv;

            case 'hslArray':
                return HSVtoHSL(hsv);

            case 'hsl':
                var hsl = HSVtoHSL(hsv);
                return 'hsl(' + hsl[0] + ', ' + hsl[1] + '%, ' + hsl[2] + '%)';

            case 'rgbArray':
                return HSVtoRGB(hsv);

            case 'rgb':
                var rgb = HSVtoRGB(hsv);
                return 'rgb(' + rgb.join(', ') + ')';

            default:
                return HSVtoHex(hsv);
        }

    }

    function getMinimumBrightness(H, S) {

        var lowerBounds = getColorInfo(H).lowerBounds;

        for (var i = 0; i < lowerBounds.length - 1; i++) {

            var s1 = lowerBounds[i][0],
                v1 = lowerBounds[i][1];

            var s2 = lowerBounds[i + 1][0],
                v2 = lowerBounds[i + 1][1];

            if (S >= s1 && S <= s2) {

                var m = (v2 - v1) / (s2 - s1),
                    b = v1 - m * s1;

                return m * S + b;
            }

        }

        return 0;
    }

    function getHueRange(colorInput) {

        if (typeof parseInt(colorInput) === 'number') {

            var number = parseInt(colorInput);

            if (number < 360 && number > 0) {
                return [number, number];
            }

        }

        if (typeof colorInput === 'string') {

            if (colorDictionary[colorInput]) {
                var color = colorDictionary[colorInput];
                if (color.hueRange) {
                    return color.hueRange
                }
            }
        }

        return [0, 360];

    }

    function getSaturationRange(hue) {
        return getColorInfo(hue).saturationRange;
    }

    function getColorInfo(hue) {

        // Maps red colors to make picking hue easier
        if (hue >= 334 && hue <= 360) {
            hue -= 360;
        }

        for (var colorName in colorDictionary) {
            var color = colorDictionary[colorName];
            if (color.hueRange &&
                hue >= color.hueRange[0] &&
                hue <= color.hueRange[1]) {
                return colorDictionary[colorName];
            }
        }
        return 'Color not found';
    }

    function randomWithin(range) {
        if (seed == null) {
            return Math.floor(range[0] + Math.random() * (range[1] + 1 - range[0]));
        } else {
            //Seeded random algorithm from http://indiegamr.com/generate-repeatable-random-numbers-in-js/
            var max = range[1] || 1;
            var min = range[0] || 0;
            seed = (seed * 9301 + 49297) % 233280;
            var rnd = seed / 233280.0;
            return Math.floor(min + rnd * (max - min));
        }
    }

    function HSVtoHex(hsv) {

        var rgb = HSVtoRGB(hsv);

        function componentToHex(c) {
            var hex = c.toString(16);
            return hex.length == 1 ? "0" + hex : hex;
        }

        var hex = "#" + componentToHex(rgb[0]) + componentToHex(rgb[1]) + componentToHex(rgb[2]);

        return hex;

    }

    function defineColor(name, hueRange, lowerBounds) {

        var sMin = lowerBounds[0][0],
            sMax = lowerBounds[lowerBounds.length - 1][0],

            bMin = lowerBounds[lowerBounds.length - 1][1],
            bMax = lowerBounds[0][1];

        colorDictionary[name] = {
            hueRange: hueRange,
            lowerBounds: lowerBounds,
            saturationRange: [sMin, sMax],
            brightnessRange: [bMin, bMax]
        };

    }

    function loadColorBounds() {

        defineColor(
            'monochrome',
            null, [
                [0, 0],
                [100, 0]
            ]
        );

        defineColor(
            'red', [-26, 18], [
                [20, 100],
                [30, 92],
                [40, 89],
                [50, 85],
                [60, 78],
                [70, 70],
                [80, 60],
                [90, 55],
                [100, 50]
            ]
        );

        defineColor(
            'orange', [19, 46], [
                [20, 100],
                [30, 93],
                [40, 88],
                [50, 86],
                [60, 85],
                [70, 70],
                [100, 70]
            ]
        );

        defineColor(
            'yellow', [47, 62], [
                [25, 100],
                [40, 94],
                [50, 89],
                [60, 86],
                [70, 84],
                [80, 82],
                [90, 80],
                [100, 75]
            ]
        );

        defineColor(
            'green', [63, 178], [
                [30, 100],
                [40, 90],
                [50, 85],
                [60, 81],
                [70, 74],
                [80, 64],
                [90, 50],
                [100, 40]
            ]
        );

        defineColor(
            'blue', [179, 257], [
                [20, 100],
                [30, 86],
                [40, 80],
                [50, 74],
                [60, 60],
                [70, 52],
                [80, 44],
                [90, 39],
                [100, 35]
            ]
        );

        defineColor(
            'purple', [258, 282], [
                [20, 100],
                [30, 87],
                [40, 79],
                [50, 70],
                [60, 65],
                [70, 59],
                [80, 52],
                [90, 45],
                [100, 42]
            ]
        );

        defineColor(
            'pink', [283, 334], [
                [20, 100],
                [30, 90],
                [40, 86],
                [60, 84],
                [80, 80],
                [90, 75],
                [100, 73]
            ]
        );

    }

    function HSVtoRGB(hsv) {

        // this doesn't work for the values of 0 and 360
        // here's the hacky fix
        var h = hsv[0];
        if (h === 0) {
            h = 1
        }
        if (h === 360) {
            h = 359
        }

        // Rebase the h,s,v values
        h = h / 360;
        var s = hsv[1] / 100,
            v = hsv[2] / 100;

        var h_i = Math.floor(h * 6),
            f = h * 6 - h_i,
            p = v * (1 - s),
            q = v * (1 - f * s),
            t = v * (1 - (1 - f) * s),
            r = 256,
            g = 256,
            b = 256;

        switch (h_i) {
            case 0:
                r = v, g = t, b = p;
                break;
            case 1:
                r = q, g = v, b = p;
                break;
            case 2:
                r = p, g = v, b = t;
                break;
            case 3:
                r = p, g = q, b = v;
                break;
            case 4:
                r = t, g = p, b = v;
                break;
            case 5:
                r = v, g = p, b = q;
                break;
        }
        var result = [Math.floor(r * 255), Math.floor(g * 255), Math.floor(b * 255)];
        return result;
    }

    function HSVtoHSL(hsv) {
        var h = hsv[0],
            s = hsv[1] / 100,
            v = hsv[2] / 100,
            k = (2 - s) * v;

        return [
            h,
            Math.round(s * v / (k < 1 ? k : 2 - k) * 10000) / 100,
            k / 2 * 100
        ];
    }

    return randomColor;
}));