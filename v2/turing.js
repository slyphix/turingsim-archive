
//window.onerror = function (n, d, z) {
//    alert(n + "\nFile: " + d + "\nLine: " + z);
//};
window.onerror = function (n) {
    alert("Client-side error:\n" + n + "\nReload page to reset.");
};

/*
 * Turing Simulator Control Script
 * This should be never directly access the DOM.
 * jh 2016
 */

var TControl = (function (uimanager) {
    
    var DIRECTION_RIGHT = 1;
    var DIRECTION_LEFT = -1;
    var DIRECTION_NONE = 0;
    
    var MESSAGE_INFO = 0;
    var MESSAGE_ERROR = 1;
    var MESSAGE_SUCCESS = 2;
    
    var HALT_STATE_CHAR = "H";
    
    var commandPattern = /^\s*([0-9A-Za-z]{1,3}),([^, ]) +([0-9A-Za-z]{1,3}),([^, ])(?:,([>_<]))?\s*(?:#.*)?$/;
    var commandTable = {}; // commandTable[state][char] = { state char direction }
    
    var initValue = "";
    
    var currentState, currentPosition, transitions, symbols, lastDirection, running, skipping, haltState;
    var tapePos, tapeNeg;
    var maxLeft, maxRight;
    
    var TIMEOUT;
    
    var programmed = false;
    
    function setDefaultValues() {
        currentState = 1;
        currentPosition = 0;
        transitions = 0;
        symbols = 0;
        lastDirection = DIRECTION_NONE;
        
        running = false;
        skipping = false;
        haltState = false;
        
        tapePos = [];
        tapeNeg = [];
        
        maxLeft = 0;
        maxRight = 0;
        
        for (var i = 0; i < initValue.length; i++) {
            setTape(i, initValue.charAt(i));
            if (initValue.charAt(i) !== " ")
                symbols++;
            if (initValue.charAt(i) === " " && i === maxLeft)
                maxLeft++;
        }
    }
    setDefaultValues();
    

    function InitError(message) {
        this.name = "InitError";
        this.message = message;
    }
    function RuntimeError(message) {
        this.name = "RuntimeError";
        this.message = message;
    }
    
    function displayMessage(msg, type) {
        uimanager.output(timestamp() + " " + msg, {
            isErrorMessage: type === MESSAGE_ERROR,
            isInfoMessage: type === MESSAGE_INFO || type === MESSAGE_SUCCESS,
            isSuccessMessage: type === MESSAGE_SUCCESS
        });
    }
    
    function timestamp() {
        var now = new Date();
        var hours = format(now.getHours());
        var min = format(now.getMinutes());
        var sec = format(now.getSeconds());
        return "[" + hours + ":" + min + ":" + sec + "]";
    }
    
    function format(num) {
        return (num < 10) ? "0" + num : num;
    }
    
    function getTape(index) {
        return ((index < 0) ? tapeNeg[~ index] : tapePos[index]) || " ";
    }
    function setTape(index, value) {
        if (index < 0)
            tapeNeg[~ index] = value;
        else
            tapePos[index] = value;
        
        if (index > maxRight && value !== " ")
            maxRight = index;
        if (index < maxLeft && value !== " ")
            maxLeft = index;
    }
    
    // error handler
    function dealWith(error) {
        if (error instanceof InitError) {
            displayMessage("ERROR: " + error.message, MESSAGE_ERROR);
        } else if (error instanceof RuntimeError) {
            displayMessage("Machine halted:\n" + error.message + "\n" + getStatus(), MESSAGE_ERROR);
            running = false;
            skipping = false;
        } else throw error;
    }
    
    // main execution function
    function transition() {
        var char = getTape(currentPosition);

        var newState = commandTable[currentState][char];
        if (!newState) {
            haltState = true;
            updateUI();
            throw new RuntimeError("No applicable transition found for '" + char + "' in state '" + currentState + "'.");
        }
        
        setTape(currentPosition, newState.char);
        
        if (char === " " && newState.char !== " ")
            symbols += 1;
        if (char !== " " && newState.char === " ")
            symbols += -1;
        
        if (newState.char === " " && maxRight !== maxLeft) {
            if (currentPosition === maxRight)
                maxRight--;
            if (currentPosition === maxLeft)
                maxLeft++;
        }
        
        currentState = newState.state;
        currentPosition += newState.direction;
        lastDirection = newState.direction;
        transitions += 1;

        if (newState.char === " " && symbols === 0) {
            maxRight = currentPosition;
            maxLeft = currentPosition;
        }
        
        // console.log(transitions + ": " + maxLeft + "   " + maxRight);
        
        if (currentState === HALT_STATE_CHAR) {
            haltState = true;
            displayMessage("Machine halted:\nHalt state reached.\n" + getStatus(), MESSAGE_INFO);
        }
    }
    
    function getStatus() {
        return transitions + " total transitions,\n" + symbols + " non-blank symbols on tape.";
    }
    
    function updateUI() {
        uimanager.update({
            currentState: currentState,
            currentPosition: currentPosition - lastDirection,
            nextPosition: currentPosition,
            symbolCount: symbols,
            transitionCount: transitions,
            direction: lastDirection,
            
            maxRight: maxRight,
            maxLeft: maxLeft,
        
            DIRECTION_RIGHT: DIRECTION_RIGHT,
            DIRECTION_LEFT: DIRECTION_LEFT,
            DIRECTION_NONE: DIRECTION_NONE,
        
            get: getTape
        });
    }
    
    function init() {
        try {
            if (running || skipping)
                throw new InitError("Cannot install program while running!");

            displayMessage("Programming started...", MESSAGE_INFO);

            var commandTableBETA = {};

            var calledStates = []; // called ones should also exist!
            var calledByLine = {};

            var empty = true;
            var code = uimanager.getProgram().split("\n");

            for (var i = 0; i < code.length; i++) {
                if (/^\s*$/.exec(code[i])) // empty lines
                    continue;
                if (/^\s*#.*$/.exec(code[i])) // comment lines
                    continue;

                var match = commandPattern.exec(code[i]);
                if (!match)
                    throw new InitError("Syntax error in line " + (i + 1) + ".\nProgramming cancelled.");

                var stateName = match[1].replace(/^0{0,2}/, "").toUpperCase(); // leading zeroes
                var char = (match[2] === "_") ? " " : match[2];
                var calledStateName = match[3].replace(/^0{0,2}/, "").toUpperCase();
                var newChar = (match[4] === "_") ? " " : match[4];
                var dirChar = match[5] || "_";
                var direction = (dirChar === ">") ? DIRECTION_RIGHT : (dirChar === "<") ? DIRECTION_LEFT : DIRECTION_NONE;
                
                if (HALT_STATE_CHAR === stateName)
                    throw new InitError("Line " + (i + 1) + ": Attempting to override halt state. Re-check your program.\nProgramming cancelled.");

                if (!commandTableBETA[stateName])
                    commandTableBETA[stateName] = {};
                
                if (commandTableBETA[stateName][match[2]])
                    throw new InitError("Trying to override existing state transition in line " + (i + 1) + ".\nProgramming cancelled.");

                commandTableBETA[stateName][char] = { state: calledStateName, char: newChar, direction: direction };

                calledStates.push(calledStateName);
                if (!calledByLine[calledStateName])
                    calledByLine[calledStateName] = (i + 1);

                empty = false;
            }

            if (empty)
                throw new InitError("No program code entered. Programming cancelled.");

            for (var i = 0; i < calledStates.length; i++)
                if (Object.keys(commandTableBETA).indexOf(calledStates[i]) === -1 && calledStates[i] !== HALT_STATE_CHAR)
                    throw new InitError("Potential call to undefined state '" + calledStates[i] + "' in line " + 
                        calledByLine[calledStates[i]] + ". Re-check your program.\nProgramming cancelled.");

            if (Object.keys(commandTableBETA).indexOf("1") === -1)
                throw new InitError("No transition rules found for initial state '1'.\nProgramming cancelled.");
            
        } catch (error) {
            dealWith(error);
            return;
        }

        commandTable = commandTableBETA;

        initValue = uimanager.getInitial();
        programmed = true;

        setDefaultValues();
        updateUI();
        
        displayMessage("Machine programmed successfully.", MESSAGE_SUCCESS);
    }
    
    function step() {
        try {
            if (!programmed)
                throw new InitError("No programming entered.");
            if (running || skipping)
                throw new InitError("Already running!");
            if (haltState)
                throw new InitError("Halt state reached.");
            
            transition();
            updateUI();
            
        } catch (error) {
            dealWith(error);
        }
    }
    
    function reset() {
        try {
            if (running || skipping)
                throw new InitError("Cannot reset while running!");
            if (!programmed)
                throw new InitError("Machine not programmed.");
            
            setDefaultValues();
            
            displayMessage("Reset successful.", MESSAGE_INFO);
            
            updateUI();
        } catch (error) {
            dealWith(error);
        }
    }
    
    function skip() {
        try {
            if (!programmed)
                throw new InitError("Machine not programmed.");
            if (running || skipping)
                throw new InitError("Already running!");
            if (haltState)
                throw new InitError("Halt state reached.");
            
            displayMessage("Started computation...", MESSAGE_INFO);
            skipping = true;
            
            var start = new Date().getTime();
            var MAX_RUNTIME = 5000;
            
            // checking time every iteration takes a lot of time
            var CHECK_INTERVAL = 1000;
            var nextTimeCheck = 0;
            
            while (!haltState) {
                transition();
                nextTimeCheck++;
                
                if (nextTimeCheck === CHECK_INTERVAL) {
                    if (new Date().getTime() - start > MAX_RUNTIME) {
                        updateUI();
                        throw new RuntimeError("Computation time limit exceeded.");
                    }
                    nextTimeCheck = 0;
                }
            }
            skipping = false;
            
            displayMessage("Finished computation.", MESSAGE_INFO);
            
            updateUI();
            
        } catch (error) {
            dealWith(error);
        }
    }
    
    function start() {
        try {
            if (!programmed)
                throw new InitError("Machine not programmed.");
            if (running || skipping)
                throw new InitError("Already running!");
            if (haltState)
                throw new InitError("Halt state reached.");
            
            displayMessage("Machine started...", MESSAGE_INFO);
            
            running = true;
            
            function schedule() {
                try {
                    transition();
                    updateUI();
                    if (!haltState) {
                        var delay = uimanager.getTransitionDelay();
                        
                        if (delay < 10)
                            throw new Error("Delay must be greater than 10 ms!");
                        
                        TIMEOUT = setTimeout(schedule, delay);
                    } else {
                        running = false;
                    }
                } catch (error) {
                    dealWith(error);
                }
            }
            schedule();
        } catch (error) {
            dealWith(error);
        }
    }
    
    function stop() {
        try {
            if (skipping)
                throw new InitError("Cannot cancel computation!");
            if (!running)
                throw new InitError("Machine not running!");

            clearTimeout(TIMEOUT);

            running = false;

            displayMessage("Machine halted:\nUser interrupt.\n" + getStatus(), MESSAGE_INFO);
        } catch (error) {
            dealWith(error);
        }
    }

    return {
        init: init,
        skip: skip,
        step: step,
        start: start,
        stop: stop,
        reset: reset
    };
    
})(UIManager);
