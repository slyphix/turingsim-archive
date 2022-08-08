
/*
 * Second version of TMS UIManager
 * Prime example of overloading...
 */

var UIManager = (function () {
    
    /* DECLARATIONS */
    
    var TAPE_SIZE = 25;
    var TAPE_CENTER = 12;
    var TAPE = [];
    
    var DELAY = [2000, 700, 300, 50];
        
    /* INIT METHOD (ALWAYS PUBLIC!) */
    
    function init () {
        window.addEventListener("resize", updateScroll);

        document.getElementById("program").addEventListener("input", updateProgramSlide);
        document.getElementById("clearprog").addEventListener("click", showProgramOverlay);
        document.getElementById("clearout").addEventListener("click", clearOutput);
        document.getElementById("cancel").addEventListener("click", hideProgramOverlay);
        document.getElementById("clear").addEventListener("click", clearProgram);

        document.getElementById("fullbutton").addEventListener("click", fullTapeToggle);

        document.getElementById("overlay").addEventListener("click", hideOverlay);

        document.getElementById("help").addEventListener("click", showOverlay);
        document.getElementById("install").addEventListener("click", TControl.init);

        document.getElementById("start").addEventListener("click", TControl.start);
        document.getElementById("halt").addEventListener("click", TControl.stop);
        document.getElementById("reset").addEventListener("click", TControl.reset);
        document.getElementById("step").addEventListener("click", TControl.step);
        document.getElementById("calc").addEventListener("click", TControl.skip);
        
        buildTape();
        updateProgramSlide();
    }
    
    /* BETA CONTENT */
    
    var FULLTAPE = 10000;
    
    var fullTapeActive = false;
    var betaActive = false;
    var lastStatus;
    
    function fullTapeToggle () {
        if (!fullTapeActive) {
           showFullTape();
        } else {
            hideFullTape();
        }
    }
    function showFullTape () {
        if (!betaActive) {
            addClass(document.getElementById("fullbutton"), "activated");
            output("EXPERIMENTAL FEATURE!\nEntire tape view activated. This feature can sometimes be unresponsive or negatively impact performance.", {sys: true});
            output("Please keep in mind that full tape view cannot exceed a set size limit for stability reasons.");
            betaActive = true;
        }
        
        fullTapeActive = true;
        updateFullTape(lastStatus);
        
        addClass(document.getElementById("fulltile"), "shown");
        
        document.getElementById("fulltext").innerHTML = "Disable full tape view";
    }
    function hideFullTape () {
        fullTapeActive = false;
        
        var fulltile = document.getElementById("fulltile");
        while (fulltile.firstChild)
            fulltile.removeChild(fulltile.firstChild);
        
        removeClass(document.getElementById("fulltile"), "shown");
        document.getElementById("fulltext").innerHTML = "View entire tape BETA";
    }
    function updateFullTape (status) {
        addClass(document.getElementById("fullbutton"), "available");
        if (!fullTapeActive)
            return;
        
        var fulltile = document.getElementById("fulltile");
        while (fulltile.firstChild)
            fulltile.removeChild(fulltile.firstChild);
        
        var slider = document.createElement("div");
        slider.id = "fullslider";

        var mr = status.maxRight;
        var ml = status.maxLeft;
        if (status.nextPosition > mr)
            mr = status.nextPosition;
        if (status.nextPosition < ml)
            ml = status.nextPosition;
        
        var upperlimit = status.currentPosition + FULLTAPE/2;
        var lowerlimit = status.currentPosition - FULLTAPE/2;
        
        mr = Math.min(upperlimit, mr);
        ml = Math.max(lowerlimit, ml);
        
        slider.style.width = (mr - ml + 3) * 40 + "px";
        
        for (var i = ml - 1; i <= mr + 1; i++) {
            var num = i.toString();
            if (i > 0 && num.length > 5)
                num = "*" + num.substring(num.length - 5);
            if (i < 0 && num.length > 5)
                num = "-*" + num.substring(num.length - 4);
            var node = createFullNode(num, status.get(i));
            if (status.nextPosition === i)
                node.className += " currentpos";
            slider.appendChild(node);
        }
        
        fulltile.appendChild(slider);
        updateScroll();
    }
    function createFullNode (num, val) {
        var frame = document.createElement("div");
        frame.className = "valueframe";
        var value = document.createElement("div");
            value.className = "value";
            value.innerHTML = val;
        frame.appendChild(value);
        var number = document.createElement("div");
            number.className = "number";
            number.innerHTML = num;
        frame.appendChild(number);
        return frame;
    }
    function updateScroll () {
        var frame = document.getElementById("fulltile");
        if (frame.clientWidth < frame.scrollWidth) {
            removeClass(frame, "noscroll");
        } else {
            addClass(frame, "noscroll");
        }
    }
    
    /* PRIVATE METHODS */
    
    function addClass (elem, classname) {
        var classes = elem.className.split(" ");
        if (classes.indexOf(classname) === -1)
            classes.push(classname);
        elem.className = classes.join(" ");
    }
    function removeClass (elem, classname) {
        var classes = elem.className.split(" ");
        if (classes.indexOf(classname) !== -1)
            classes.splice(classes.indexOf(classname), 1);
        elem.className = classes.join(" ");
    }
    function showOverlay () {
        document.getElementById("overlay").className = "visible";
        document.getElementById("helpwrapper").className = "up";
    }
    function hideOverlay () {
        document.getElementById("helpwrapper").className = "";
        document.getElementById("overlay").className = "";
    }
    
    var lastInstalled = "";
    function updateProgramSlide () {
        var slidebutton = document.getElementById("clearprog");
        var edited = document.getElementById("editednote");
        
        function clean(input) { return input.replace(/ *$|^ */gm, "").replace(/ +/g, " "); }
        
        var currentProgram = getProgram();
        if (clean(lastInstalled) !== clean(currentProgram)) {
            addClass(edited, "shown");
        } else {
            removeClass(edited, "shown");
        }
        
        if (document.getElementById("program").value) {
            addClass(slidebutton, "down");
        } else {
            removeClass(slidebutton, "down");
        }
    }
    function updateOutputSlide () {
        var slidebutton = document.getElementById("clearout");
        if (document.getElementById("output").innerHTML) {
            addClass(slidebutton, "down");
        } else {
            removeClass(slidebutton, "down");
        }
    }
    function showProgramOverlay () {
        document.getElementById("confirmoverlay").className = "visible";
    }
    function hideProgramOverlay () {
        document.getElementById("confirmoverlay").className = "";
    }
    function clearProgram () {
        document.getElementById("program").value = "";
        updateProgramSlide();
        hideProgramOverlay();
    }
    function clearOutput () {
        document.getElementById("output").innerHTML = "";
        updateOutputSlide();
    }
    function getTransitionDelay () {
        return DELAY[document.getElementById("speed").selectedIndex];
    }
    function buildTape () {
        document.getElementById("slider").style.width = (40 * TAPE_SIZE + 2) + "px";
        for (var i = 0; i < TAPE_SIZE; i++) {
            TAPE[i] = document.createElement("div");
            TAPE[i].className = "value";
            document.getElementById("slider").appendChild(TAPE[i]);
        }
    }

    
    /* PUBLIC METHODS */
    function output (str, type) {
        var para = document.createElement("p");
        var type = type || {};
        if (type.sys)
            para.className = "em";
        if (type.isSuccessMessage) {
            lastInstalled = getProgram();
            removeClass(document.getElementById("editednote"), "shown");
        }
        para.innerHTML += str.replace(/\n/g, "<br>");
        document.getElementById("output").appendChild(para);
        updateOutputSlide();
    }
    function getProgram () {
        return document.getElementById("program").value;
    }
    function getInitial () {
        return document.getElementById("initial").value;
    }
    
    function update (status) {
        // QOL TODO: DEACTIVATE BUTTONS WHEN UNCLICKABLE
        
        lastStatus = status;
        
        function getFontSize(num) {
            return 1/(num.toString().length + 2) * 3 * 30 + "px";
        }
        
        function format(val) {
            if (val < 100000 && val > -10000)
                return val;
            var sign = (val < 0) ? "-" : "";
            var abs = Math.abs(val);
            return sign + abs.toString().charAt(0) + "e" + Math.floor(Math.log(abs) / Math.log(10));
        }
        
        function setStatus(id, value) {
            if (typeof value === "number")
                value = format(value);
            document.getElementById(id).innerHTML = value;
            document.getElementById(id).style.fontSize = getFontSize(value);
        }
        
        setStatus("state", status.currentState);
        setStatus("pos", status.nextPosition);
        setStatus("symbols", status.symbolCount);
        setStatus("transitions", status.transitionCount);
        
        document.getElementById("rightindicator").className = "indicator" + ((status.direction === status.DIRECTION_RIGHT) ? " active" : "" );
        document.getElementById("leftindicator").className = "indicator" + ((status.direction === status.DIRECTION_LEFT) ? " active" : "" );
        
        updateFullTape(status);
        
        for (var i = 0; i < TAPE_SIZE; i++) {
            TAPE[i].innerHTML = status.get(status.currentPosition - TAPE_CENTER + i);
        }
        
        var duration = getTransitionDelay() * (3/4);
        
        document.getElementById("slider").className = "inactive";
        
        if (duration > 100) {
            document.getElementById("slider").style.left = 0;
            setTimeout(function () {
                document.getElementById("slider").className = "";
                document.getElementById("slider").style.transitionDuration = duration + "ms";
                document.getElementById("slider").style.left = - status.direction * 40 + "px";
            }, 30);
        } else {
            document.getElementById("slider").style.left = - status.direction * 40 + "px";
        }
    }
    
    /* REVEALS */
    
    return {
        init: init,
        update: update,
        output: output,
        getProgram: getProgram,
        getInitial: getInitial,
        getTransitionDelay: getTransitionDelay
    };
})();

addEventListener("load", UIManager.init);
