
## JavaScript Turing Machine Simulator Archive

This repository contains the previous versions of my [Turing Machine simulator](https://github.com/slyphix/turingsim/).

### v1 (2014)

[Click here to visit the first version.](https://slyphix.github.io/turingsim-archive/v1/)

In my final year of school, I learned about computability theory in my CS class.
Back then, we had to use a Java Applet to simulate Turing Machines, even though Java Applets already were a dying technology at that point.
Due to Java's strange security policies, nobody in my class was able to copy-paste their code for hand-in, forcing everyone to retype every single program.
After complaining to my teacher multiple times about this inconvenience, he challenged me to write a better simulator.

Two days later, I published the first version of the TM simulator.
The UI was designed to closely match the Java Applet, and I also adopted the programming syntax and semantics.
Shortly after, my teacher officially permitted using the JavaScript simulator instead the Java Applet.

### v2 (2016)

[Click here to visit the second version.](https://slyphix.github.io/turingsim-archive/v2/)

I was surprised to find out that my simulator had been used for teaching the next year's class as well, and so I decided to do a visual overhaul.
I also added the "run until completion" feature that was missing from the first version (due to me being too lazy).
Furthermore, I extended the syntax to include comments.

### v3 (2016)

[Click here to visit the third version.](https://slyphix.github.io/turingsim-archive/v3/)

Within the same year, I noticed that my overdue "run until completion" feature caused most browsers to become unresponsive.
My naive solution was to use JavaScript's WebWorker API to simulate the TM concurrently, which worked surprisingly well.
I also rewrote the code to what I thought was a "modular design" back then, but that turned everything into an unmaintainable mess in the process.
I have learnt a lot about modularization since then.

The third version also included the option to view the entire tape during and after execution, not just the region around the tape head.
This made it possible to check whether the TM produced the correct result.

I was working on an undocumented feature called "environment directives" before dropping the project due to a lack of time.
This feature would allow the user to change the names of the initial state and the halt state, leading to more readable code.
Environment directives eventually made it into version 4 as "meta instructions".

### v4 (2022)

A few years passed, and I had come up with a large list of features to add to my simulator.
In 2022, I finally had some spare time to do one last rewrite.
I hope that this version can also find its way to CS classrooms around the world.

[See for yourself!](https://github.com/slyphix/turingsim/)
