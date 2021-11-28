import { Component } from "@angular/core";

@Component({
    selector: "app-root",
    templateUrl: "./app.component.html",
    styleUrls: ["./app.component.scss"],
})
export class AppComponent {
    // Set the number of snowflakes (more than 30 - 40 not recommended)
    private snowmax = 35;

    // Set the colors for the snow. Add as many colors as you like
    private snowcolor = ["#aaaacc", "#ddddff", "#ccccdd", "#f3f3f3", "#f0ffff"];

    // Set the fonts, that create the snowflakes. Add as many fonts as you like
    private snowtype = ["Times", "Arial", "Times", "Verdana"];

    // Set the letter that creates your snowflake (recommended: * )
    private snowletter = "*";

    // Set the speed of sinking (recommended values range from 0.3 to 2)
    private sinkspeed = 0.6;

    // Set the maximum-size of your snowflakes
    private snowmaxsize = 30;

    // Set the minimal-size of your snowflakes
    private snowminsize = 8;

    // Set the snowing-zone
    // Set 1 for all-over-snowing, set 2 for left-side-snowing
    // Set 3 for center-snowing, set 4 for right-side-snowing
    private snowingzone = 1 as number;

    /// ////////////////////////////////////////////////////////////////////////
    // CONFIGURATION ENDS HERE
    /// ////////////////////////////////////////////////////////////////////////

    // Do not edit below this line
    private snow = [];
    private marginbottom;
    private marginright;
    private xMv = [];
    private crds = [];
    private lftrght = [];
    private browserinfos = navigator.userAgent;
    private ie5 = document.all && document.getElementById && !this.browserinfos.match(/Opera/);
    private ns6 = document.getElementById && !document.all;
    private opera = this.browserinfos.match(/Opera/);
    public ngOnInit(): void {
        /*
Snow Fall 1 - no images - Java Script
Visit http://rainbow.arch.scriptmania.com/scripts/
  for this script and many more
*/

        for (let i = 0; i <= this.snowmax; i++) {
            const span = document.createElement("span");
            span.style.pointerEvents = "none";
            span.style.position = "absolute";
            span.style.top = `-${this.snowmaxsize}`;
            span.innerText = this.snowletter;
            span.id = `s${i}`;

            document.body.appendChild(span);
        }
        this.initSnow();
    }
    private randommaker(range) {
        return Math.floor(range * Math.random());
    }

    private initSnow() {
        if (this.ie5 || this.opera) {
            this.marginbottom = document.body.scrollHeight;
            this.marginright = document.body.clientWidth - 15;
        } else if (this.ns6) {
            this.marginbottom = document.body.scrollHeight;
            this.marginright = window.innerWidth - 15;
        }
        const snowsizerange = this.snowmaxsize - this.snowminsize;
        for (let i = 0; i <= this.snowmax; i++) {
            this.crds[i] = 0;
            this.lftrght[i] = Math.random() * 15;
            this.xMv[i] = 0.03 + Math.random() / 10;
            this.snow[i] = document.getElementById(`s${i}`);
            this.snow[i].style.fontFamily = this.snowtype[this.randommaker(this.snowtype.length)];
            this.snow[i].size = this.randommaker(snowsizerange) + this.snowminsize;
            this.snow[i].style.fontSize = `${this.snow[i].size}px`;
            this.snow[i].style.color = this.snowcolor[this.randommaker(this.snowcolor.length)];
            this.snow[i].style.zIndex = 1000;
            this.snow[i].sink = (this.sinkspeed * this.snow[i].size) / 5;
            if (this.snowingzone == 1) {
                this.snow[i].posx = this.randommaker(this.marginright - this.snow[i].size);
            }
            if (this.snowingzone == 2) {
                this.snow[i].posx = this.randommaker(this.marginright / 2 - this.snow[i].size);
            }
            if (this.snowingzone == 3) {
                this.snow[i].posx = this.randommaker(
                    this.marginright / 2 - this.snow[i].size,
                ) + this.marginright / 4;
            }
            if (this.snowingzone == 4) {
                this.snow[i].posx = this.randommaker(
                    this.marginright / 2 - this.snow[i].size,
                ) + this.marginright / 2;
            }
            this.snow[i].posy = this.randommaker(
                2 * this.marginbottom - this.marginbottom - 2 * this.snow[i].size,
            );
            this.snow[i].style.left = `${this.snow[i].posx}px`;
            this.snow[i].style.top = `${this.snow[i].posy}px`;
        }
        // eslint-disable-next-line no-use-before-define
        this.moveSnow();
    }

    private moveSnow() {
        for (let i = 0; i <= this.snowmax; i++) {
            this.crds[i] += this.xMv[i];
            this.snow[i].posy += this.snow[i].sink;
            this.snow[i].style.left = `${this.snow[i].posx + this.lftrght[i] * Math.sin(this.crds[i])}px`;
            this.snow[i].style.top = `${this.snow[i].posy}px`;

            if (this.snow[i].posy >= this.marginbottom - 2 * this.snow[i].size
                || parseInt(this.snow[i].style.left) > (this.marginright - 3 * this.lftrght[i])) {
                if (this.snowingzone == 1) {
                    this.snow[i].posx = this.randommaker(this.marginright - this.snow[i].size);
                }
                if (this.snowingzone == 2) {
                    this.snow[i].posx = this.randommaker(this.marginright / 2 - this.snow[i].size);
                }
                if (this.snowingzone == 3) {
                    this.snow[i].posx = this.randommaker(
                        this.marginright / 2 - this.snow[i].size,
                    ) + this.marginright / 4;
                }
                if (this.snowingzone == 4) {
                    this.snow[i].posx = this.randommaker(
                        this.marginright / 2 - this.snow[i].size,
                    ) + this.marginright / 2;
                }
                this.snow[i].posy = 0;
            }
        }
        setTimeout(() => this.moveSnow(), 30);
    }
}
