'use strict';

const fs = require('fs');
const concat = require('concat-stream');
const PNGBase = require('../png-base');

module.exports = class PNGImage extends PNGBase {
    constructor(png) {
        super();

        this._png = png;
    }

    getPixel(x, y) {
        const idx = this._getIdx(x, y);
        return {
            R: this._png.data[idx],
            G: this._png.data[idx + 1],
            B: this._png.data[idx + 2]
        };
    }

    setPixel(x, y, color, transparency) {
        const idx = this._getIdx(x, y);
        this._png.data[idx] = color.R;
        this._png.data[idx + 1] = color.G;
        this._png.data[idx + 2] = color.B;
        if (transparency !== undefined && transparency !== null && !isNaN(transparency)) {
            this._png.data[idx + 3] = Math.round(255 * transparency);
        } else {
            this._png.data[idx + 3] = 255;
        }
    }

    highlightPixel(x, y, width, height, color, transparency, spread) {
        this.setPixel(x, y, color, transparency);
        let xTopRight,
            yTopRight,
            xBottomRight,
            yBottomRight,
            xBottomLeft,
            yBottomLeft,
            xTopLeft,
            yTopLeft = 0;
        for (let i = 0; i <= spread; i++) {
            for (let j = 0; j <= spread - i; j++) {
                xTopRight = x + i; yTopRight = y + j;
                if (xTopRight < width) this.setPixel(xTopRight, yTopRight, color, transparency);
                xBottomRight = x + i; yBottomRight = y - j;
                if (xBottomRight < width && yBottomRight < height) this.setPixel(xBottomRight, yBottomRight, color, transparency);
                xBottomLeft = x - i; yBottomLeft = y - j;
                if (xBottomLeft > 0 && yBottomLeft < height) this.setPixel(xBottomLeft, yBottomLeft, color, transparency);
                xTopLeft = x - i; yTopLeft = y + j;
                if (xTopLeft > 0 && yTopLeft < height) this.setPixel(xTopLeft, yTopLeft, color, transparency);
            }
        }
    }

    setTransparentPixel(x, y) {
        const idx = this._getIdx(x, y);
        this._png.data[idx] = 0;
        this._png.data[idx + 1] = 0;
        this._png.data[idx + 2] = 0;
        this._png.data[idx + 3] = 0;
    }

    _getIdx(x, y) {
        return (this._png.width * y + x) * 4;
    }

    save(path, callback) {
        const writeStream = fs.createWriteStream(path);
        this._png.pack().pipe(writeStream);

        writeStream.on('error', (error) => callback(error));
        writeStream.on('finish', () => callback(null));
    }

    createBuffer(callback) {
        this._png.pack().pipe(concat(gotDiff));
        this._png.on('error', (error) => callback(error, null));

        function gotDiff(data) {
            callback(null, data);
        }
    }
};
