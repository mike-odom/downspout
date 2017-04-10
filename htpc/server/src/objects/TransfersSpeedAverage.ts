/**
 * Calculates a moving average based on data transferred
 */
class TransferSpeedAverage {
    private sizeSum: number = 0;
    private timeSum: number = 0;

    private lastTime: number = Date.now();
    private readonly points = [];

    private readonly MAX_FRAMES = 30;

    private readonly MIN_FRAME_TIME = 1000;

    private frameSize = 0;
    private frameDuration = 0;

    dataReceived(size) {
        let curTime = Date.now();
        let timeDelta = curTime - this.lastTime;

        this.frameDuration += timeDelta;
        this.frameSize += size;

        if (this.frameDuration < this.MIN_FRAME_TIME) {
            return;
        }

        size = this.frameSize;
        timeDelta = this.frameDuration;

        this.points.push({size, timeDelta});
        this.sizeSum += size;
        this.timeSum += timeDelta;

        this.lastTime = curTime;

        console.log("sizes", size, this.sizeSum, this.average());

        //Trim
        if (this.points.length > this.MAX_FRAMES) {
            var data = this.points[0];

            this.sizeSum -= data.size;
            this.timeSum -= data.timeDelta;

            this.points.splice(0, 1);
        }
    }

    average() {
        return this.sizeSum / (this.timeSum / 1000);
    }
}